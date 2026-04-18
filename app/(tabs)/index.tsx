import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

const H_PAD = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNeighborIndices(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors: number[] = [];
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r === row && c === col) continue;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        neighbors.push(r * size + c);
      }
    }
  }
  return neighbors;
}

function placeBombs(
  total: number,
  count: number,
  safeIdx: number,
  size: number
): Set<number> {
  const safe = new Set([safeIdx, ...getNeighborIndices(safeIdx, size)]);
  const result = new Set<number>();
  const max = Math.min(count, total - safe.size);
  while (result.size < max) {
    const idx = Math.floor(Math.random() * total);
    if (!safe.has(idx)) result.add(idx);
  }
  return result;
}

function countAdjacentBombs(index: number, size: number, bombs: Set<number>): number {
  return getNeighborIndices(index, size).filter(n => bombs.has(n)).length;
}

function floodReveal(
  startIdx: number,
  size: number,
  bombs: Set<number>,
  existing: Set<number>
): Set<number> {
  const result = new Set(existing);
  const queue = [startIdx];
  while (queue.length > 0) {
    const idx = queue.shift()!;
    if (result.has(idx) || bombs.has(idx)) continue;
    result.add(idx);
    if (countAdjacentBombs(idx, size, bombs) === 0) {
      for (const n of getNeighborIndices(idx, size)) {
        if (!result.has(n)) queue.push(n);
      }
    }
  }
  return result;
}

function padNum(n: number, digits: number): string {
  return String(n).padStart(digits, '0');
}

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000FF', 2: '#007B00', 3: '#FF0000', 4: '#00007B',
  5: '#7B0000', 6: '#007B7B', 7: '#000000', 8: '#808080',
};

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

// ─── Component ───────────────────────────────────────────────────────────────

export default function GridScreen() {
  const [gridSize, setGridSize] = useState(10);
  const [inputValue, setInputValue] = useState('10');
  const [bombInput, setBombInput] = useState('10');

  // Minesweeper state
  const [bombs, setBombs] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [exploded, setExploded] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const isFirstTap = useRef(true); // ref avoids race conditions on rapid taps

  const total = gridSize * gridSize;
  const digits = Math.max(2, String(total - 1).length);

  const screenWidth = Dimensions.get('window').width;
  const gridWidth = screenWidth - H_PAD * 2;
  const cellSize = Math.min(26, Math.floor(gridWidth / gridSize));
  const fontSize = Math.max(8, Math.min(12, cellSize * 0.42));

  const resetGame = (newSize: number) => {
    setGridSize(newSize);
    setBombs(new Set());
    setRevealed(new Set());
    setExploded(null);
    setGameStatus('idle');
    isFirstTap.current = true;
  };

  const handleRegenerate = () => {
    const n = parseInt(inputValue, 10);
    if (!isNaN(n) && n > 0 && n <= 50) resetGame(n);
  };

  const handleCellPress = useCallback(
    (idx: number) => {
      if (gameStatus === 'won' || gameStatus === 'lost') return;
      if (revealed.has(idx)) return;

      let currentBombs = bombs;

      // First tap: place bombs, guaranteeing the tapped cell is safe
      if (isFirstTap.current) {
        isFirstTap.current = false;
        const bombCount = Math.max(1, Math.min(parseInt(bombInput, 10) || 10, total - 9));
        currentBombs = placeBombs(total, bombCount, idx, gridSize);
        setBombs(currentBombs);
      }

      if (currentBombs.has(idx)) {
        // Reveal all bombs and mark the exploded cell
        const allRevealed = new Set(revealed);
        currentBombs.forEach(b => allRevealed.add(b));
        setRevealed(allRevealed);
        setExploded(idx);
        setGameStatus('lost');
        return;
      }

      const next = floodReveal(idx, gridSize, currentBombs, revealed);
      setRevealed(next);

      const safeCells = total - currentBombs.size;
      const revealedSafe = [...next].filter(i => !currentBombs.has(i)).length;
      if (revealedSafe === safeCells) {
        setGameStatus('won');
      } else {
        setGameStatus('playing');
      }
    },
    [gameStatus, revealed, bombs, bombInput, total, gridSize]
  );

  const getStatusText = (): string => {
    if (gameStatus === 'won') return '🎉 You Win!';
    if (gameStatus === 'lost') return '💥 Game Over!';
    const configured = Math.max(1, Math.min(parseInt(bombInput, 10) || 10, total - 9));
    if (gameStatus === 'idle') return `💣 ${configured} bombs hidden — tap to start`;
    const revealedSafe = [...revealed].filter(i => !bombs.has(i)).length;
    const remaining = total - bombs.size - revealedSafe;
    return `💣 ${bombs.size} bombs · ${remaining} cells left`;
  };

  const getCellContent = (idx: number): string => {
    if (!revealed.has(idx)) return padNum(idx, digits); // original: show number
    if (bombs.has(idx)) return '💣';
    const adj = countAdjacentBombs(idx, gridSize, bombs);
    return adj > 0 ? String(adj) : '';
  };

  const getCellTextColor = (idx: number): string => {
    if (!revealed.has(idx)) return '#1C1C1E';
    const adj = countAdjacentBombs(idx, gridSize, bombs);
    return NUMBER_COLORS[adj] ?? '#1C1C1E';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Grid */}
      <View style={[styles.grid, { width: cellSize * gridSize }]}>
        {Array.from({ length: gridSize }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: gridSize }, (_, col) => {
              const idx = row * gridSize + col;
              const isRevealed = revealed.has(idx);
              const isBomb = isRevealed && bombs.has(idx);
              const isExploded = idx === exploded;
              return (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    isRevealed && !isBomb && styles.revealedCell,
                    isBomb && !isExploded && styles.bombCell,
                    isExploded && styles.explodedCell,
                  ]}
                  onPress={() => handleCellPress(idx)}
                  activeOpacity={isRevealed ? 1 : 0.6}
                  accessibilityLabel={`Cell ${padNum(idx, digits)}`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.cellText,
                      { fontSize, color: getCellTextColor(idx) },
                      isBomb && { fontSize: Math.max(8, cellSize * 0.55) },
                    ]}
                  >
                    {getCellContent(idx)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Status */}
      <View style={styles.statsContainer}>
        <Text
          style={[
            styles.statsText,
            gameStatus === 'won' && styles.wonText,
            gameStatus === 'lost' && styles.lostText,
          ]}
        >
          {getStatusText()}
        </Text>
      </View>

      {/* Rows/Cols input */}
      <Text style={styles.label}>Enter the number of Rows and Columns:</Text>
      <TextInput
        style={styles.input}
        value={inputValue}
        onChangeText={setInputValue}
        keyboardType="numeric"
        textAlign="center"
        returnKeyType="done"
        onSubmitEditing={handleRegenerate}
        accessibilityLabel="Number of rows and columns"
      />

      {/* Bombs input */}
      <Text style={styles.label}>Enter the number of Bombs 💣:</Text>
      <TextInput
        style={styles.input}
        value={bombInput}
        onChangeText={setBombInput}
        keyboardType="numeric"
        textAlign="center"
        returnKeyType="done"
        onSubmitEditing={handleRegenerate}
        accessibilityLabel="Number of bombs"
      />

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegenerate}
        activeOpacity={0.85}
        accessibilityLabel="Regenerate grid"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>REGENERATE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles (original preserved, new entries appended) ───────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingHorizontal: H_PAD,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  grid: {
    borderWidth: 1,
    borderColor: '#C8C8CE',
    backgroundColor: '#C8C8CE',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: '#F5F5F5',
    borderWidth: 0.5,
    borderColor: '#C8C8CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    backgroundColor: '#C8DFFF',
  },
  cellText: {
    color: '#1C1C1E',
    fontVariant: ['tabular-nums'],
  },
  selectedCellText: {
    fontWeight: '700',
    color: '#0055CC',
  },
  statsContainer: {
    alignSelf: 'stretch',
    marginTop: 16,
    marginBottom: 14,
    minHeight: 44,
  },
  statsText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  label: {
    alignSelf: 'stretch',
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    alignSelf: 'stretch',
    height: 44,
    borderWidth: 1.5,
    borderColor: '#C8C8CE',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#1C1C1E',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  button: {
    alignSelf: 'stretch',
    height: 48,
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  // ── New: minesweeper cell states ──
  revealedCell: {
    backgroundColor: '#E0E0E0',
  },
  bombCell: {
    backgroundColor: '#FFB3B3',
  },
  explodedCell: {
    backgroundColor: '#FF3B30',
  },
  // ── New: status text variants ──
  wonText: {
    color: '#34C759',
    fontWeight: '700',
    fontSize: 17,
  },
  lostText: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 17,
  },
});
