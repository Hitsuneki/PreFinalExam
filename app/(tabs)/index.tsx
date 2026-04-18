import React, { useState } from 'react';
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

function getAdjacentCells(index: number, size: number): number[] {
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
  return neighbors.sort((a, b) => a - b);
}

function padNum(n: number, digits: number): string {
  return String(n).padStart(digits, '0');
}

export default function GridScreen() {
  const [gridSize, setGridSize] = useState(10);
  const [inputValue, setInputValue] = useState('10');
  const [selected, setSelected] = useState<number | null>(43);

  const total = gridSize * gridSize;
  const digits = Math.max(2, String(total - 1).length);
  const adjacent = selected !== null ? getAdjacentCells(selected, gridSize) : [];

  const screenWidth = Dimensions.get('window').width;
  const gridWidth = screenWidth - H_PAD * 2;
  const cellSize = Math.min(26, Math.floor(gridWidth / gridSize));
  const fontSize = Math.max(8, Math.min(12, cellSize * 0.42));

  const handleRegenerate = () => {
    const n = parseInt(inputValue, 10);
    if (!isNaN(n) && n > 0 && n <= 50) {
      setGridSize(n);
      setSelected(null);
    }
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
              const num = row * gridSize + col;
              const isSelected = selected === num;
              return (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    isSelected && styles.selectedCell,
                  ]}
                  onPress={() => setSelected(num)}
                  activeOpacity={0.6}
                  accessibilityLabel={`Cell ${padNum(num, digits)}${isSelected ? ', selected' : ''}`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.cellText,
                      { fontSize },
                      isSelected && styles.selectedCellText,
                    ]}
                  >
                    {padNum(num, digits)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {selected !== null ? `selected = ${selected}` : ''}
        </Text>
        <Text style={styles.statsText}>
          {adjacent.length > 0 ? adjacent.join(', ') : ''}
        </Text>
      </View>

      {/* Label */}
      <Text style={styles.label}>Enter the number of Rows and Columns:</Text>

      {/* Input */}
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
});
