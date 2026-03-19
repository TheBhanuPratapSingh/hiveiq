import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.1.30:8000';

const RISK_COLORS = {
  LOW: '#4CAF50', MEDIUM: '#FF9800',
  HIGH: '#f44336', CRITICAL: '#b71c1c',
};

export default function HistoryScreen({ route }) {
  const hiveName = route?.params?.hiveName || 'Hive-1';
  const [scans, setScans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [historyRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/history/${hiveName}`),
        axios.get(`${API_URL}/alerts/${hiveName}`),
      ]);
      setScans(historyRes.data.scans || []);
      setAlerts(alertsRes.data.alerts || []);
    } catch (e) {
      console.log('Error loading history:', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.hiveName}>🏠 {hiveName}</Text>

      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Active Alerts</Text>
          {alerts.map((alert, i) => (
            <View key={i} style={[
              styles.alertCard,
              { borderColor: alert.level === 'CRITICAL' ? '#b71c1c' : '#FF9800' }
            ]}>
              <Text style={styles.alertLevel}>{alert.level}</Text>
              <Text style={styles.alertMsg}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Scan History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Recent Scans</Text>
        {scans.length === 0 ? (
          <Text style={styles.emptyText}>No scans yet for {hiveName}</Text>
        ) : (
          scans.map((scan, i) => (
            <View key={i} style={styles.scanCard}>
              <View style={styles.scanHeader}>
                <Text style={styles.scanClass}>
                  {scan.final_class === 'healthy' ? '✅' : '⚠️'} {scan.final_class}
                </Text>
                <View style={[
                  styles.riskPill,
                  { backgroundColor: (RISK_COLORS[scan.risk_level] || '#888') + '33' }
                ]}>
                  <Text style={[
                    styles.riskPillText,
                    { color: RISK_COLORS[scan.risk_level] || '#888' }
                  ]}>
                    {scan.risk_level}
                  </Text>
                </View>
              </View>
              <Text style={styles.scanScore}>
                Health Score: {Math.round((scan.overall_score || 0) * 100)}%
              </Text>
              <Text style={styles.scanTime}>
                {new Date(scan.timestamp).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
        <Text style={styles.refreshText}>🔄 Refresh</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1007', padding: 16 },
  centered: { flex: 1, backgroundColor: '#1a1007', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#F5A623', marginTop: 12 },
  hiveName: { color: '#F5A623', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#F5A623', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  alertCard: {
    backgroundColor: '#2C1D08', borderRadius: 12,
    borderWidth: 1, padding: 12, marginBottom: 8,
  },
  alertLevel: { color: '#f44336', fontWeight: 'bold', fontSize: 12, marginBottom: 4 },
  alertMsg: { color: '#FDE8BB', fontSize: 13, lineHeight: 18 },
  scanCard: {
    backgroundColor: '#2C1D08', borderRadius: 12,
    borderWidth: 1, borderColor: '#4A3010',
    padding: 14, marginBottom: 8,
  },
  scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanClass: { color: '#FDE8BB', fontSize: 14, fontWeight: 'bold' },
  riskPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  riskPillText: { fontSize: 11, fontWeight: 'bold' },
  scanScore: { color: '#F5A623', fontSize: 13, marginTop: 6 },
  scanTime: { color: '#FDE8BB', opacity: 0.4, fontSize: 11, marginTop: 4 },
  emptyText: { color: '#FDE8BB', opacity: 0.5, textAlign: 'center', padding: 20 },
  refreshBtn: {
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#4A3010',
    alignItems: 'center',
  },
  refreshText: { color: '#FDE8BB', fontSize: 14 },
});