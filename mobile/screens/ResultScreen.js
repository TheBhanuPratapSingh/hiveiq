import React from 'react';
import {
  View, Text, ScrollView, Image,
  StyleSheet, TouchableOpacity
} from 'react-native';

const RISK_COLORS = {
  LOW:      '#4CAF50',
  MEDIUM:   '#FF9800',
  HIGH:     '#f44336',
  CRITICAL: '#b71c1c',
};

const CLASS_LABELS = {
  healthy:             '✅ Healthy',
  unhealthy:           '⚠️ Unhealthy',
  chalkbrood:          '🍞 Chalkbrood',
  american_foulbrood:  '🚨 American Foulbrood',
  varroa:              '🔴 Varroa Mites',
};

function MetricBar({ label, value, color }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${value * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.metricValue}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

export default function ResultScreen({ route, navigation }) {
  const { result, imageUri } = route.params;
  const riskColor = RISK_COLORS[result.risk_level] || '#888';

  return (
    <ScrollView style={styles.container}>
      {/* Image */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      {/* Risk Badge */}
      <View style={[styles.riskBadge, { backgroundColor: riskColor + '22', borderColor: riskColor }]}>
        <Text style={[styles.riskText, { color: riskColor }]}>
          {result.risk_level} RISK
        </Text>
      </View>

      {/* Main Result Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Diagnosis</Text>
        <Text style={styles.diagnosis}>
          {CLASS_LABELS[result.final_class] || result.final_class}
        </Text>
        <Text style={styles.cardLabel}>Overall Health Score</Text>
        <Text style={styles.score}>
          {Math.round(result.overall_score * 100)} / 100
        </Text>
      </View>

      {/* Metrics */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📐 Detailed Analysis</Text>
        <MetricBar
          label="🐝 Bee Activity"
          value={result.bee_activity}
          color="#F5A623"
        />
        <MetricBar
          label="🌑 Dark Cells"
          value={result.dark_cells}
          color={result.dark_cells > 0.5 ? '#4CAF50' : '#f44336'}
        />
        <MetricBar
          label="🔶 Brood Pattern"
          value={result.brood_score}
          color="#2196F3"
        />
        <MetricBar
          label="🍯 Comb Fill"
          value={result.comb_fill}
          color="#FF9800"
        />
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💡 Recommendations</Text>
        {result.recommendations && result.recommendations.map((rec, i) => (
          <View key={i} style={styles.recRow}>
            <Text style={styles.recDot}>•</Text>
            <Text style={styles.recText}>{rec}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.scanAgainBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.scanAgainText}>📷 Scan Another Hive</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate('History', {
          hiveName: result.hive_name
        })}
      >
        <Text style={styles.historyText}>📊 View History</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1007' },
  image: { width: '100%', height: 220, resizeMode: 'cover' },
  riskBadge: {
    margin: 16, padding: 12, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  riskText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  card: {
    margin: 16, marginTop: 0, padding: 16,
    backgroundColor: '#2C1D08', borderRadius: 16,
    borderWidth: 1, borderColor: '#4A3010',
  },
  cardLabel: { color: '#FDE8BB', opacity: 0.6, fontSize: 12, marginBottom: 4 },
  diagnosis: { color: '#F5A623', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  score: { color: '#FDE8BB', fontSize: 36, fontWeight: 'bold' },
  sectionTitle: { color: '#F5A623', fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metricLabel: { color: '#FDE8BB', fontSize: 12, width: 110 },
  barBg: {
    flex: 1, height: 8, backgroundColor: '#4A3010',
    borderRadius: 4, overflow: 'hidden', marginHorizontal: 8,
  },
  barFill: { height: '100%', borderRadius: 4 },
  metricValue: { color: '#FDE8BB', fontSize: 12, width: 35, textAlign: 'right' },
  recRow: { flexDirection: 'row', marginBottom: 8 },
  recDot: { color: '#F5A623', fontSize: 16, marginRight: 8 },
  recText: { color: '#FDE8BB', fontSize: 13, flex: 1, lineHeight: 20 },
  scanAgainBtn: {
    margin: 16, marginBottom: 8, padding: 16,
    backgroundColor: '#F5A623', borderRadius: 12, alignItems: 'center',
  },
  scanAgainText: { color: '#1a1007', fontSize: 16, fontWeight: 'bold' },
  historyBtn: {
    marginHorizontal: 16, padding: 14,
    borderWidth: 1, borderColor: '#F5A623',
    borderRadius: 12, alignItems: 'center',
  },
  historyText: { color: '#F5A623', fontSize: 14 },
});