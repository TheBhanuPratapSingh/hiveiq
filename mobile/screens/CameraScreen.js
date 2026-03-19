import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'http://192.168.1.30:8000';

export default function CameraScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hiveName] = useState('Hive-1');

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access in settings');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow gallery access in settings');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const analyzeHive = async () => {
    if (!image) {
      Alert.alert('No image', 'Please take or select a photo first');
      return;
    }

    setLoading(true);

    try {
      // Build form data
      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'hive.jpg',
      });

      // Send to backend using fetch (more reliable than axios for files)
      const response = await fetch(
        `${API_URL}/scan?hive_name=${hiveName}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();

      navigation.navigate('Result', {
        result: data,
        imageUri: image.uri,
      });

    } catch (error) {
      console.log('Error details:', error.message);
      Alert.alert(
        'Error',
        `Analysis failed: ${error.message}\n\nMake sure backend is running with --host 0.0.0.0`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Beehive Health Scanner</Text>
      <Text style={styles.subtitle}>Take a clear photo of your hive frame</Text>

      {/* Image Preview */}
      <View style={styles.imageBox}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🍯</Text>
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
      </View>

      {/* Take Photo */}
      <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
        <Text style={styles.primaryBtnText}>📷  Take Photo</Text>
      </TouchableOpacity>

      {/* Gallery */}
      <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromGallery}>
        <Text style={styles.secondaryBtnText}>🖼️  Choose from Gallery</Text>
      </TouchableOpacity>

      {/* Analyze — only shows after image selected */}
      {image && (
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.disabledBtn]}
          onPress={analyzeHive}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#1a1007" size="small" />
              <Text style={styles.analyzeBtnText}>  Analyzing...</Text>
            </View>
          ) : (
            <Text style={styles.analyzeBtnText}>🔬  Analyze Hive Health</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Retake */}
      {image && !loading && (
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => setImage(null)}
        >
          <Text style={styles.retakeText}>✕ Clear Image</Text>
        </TouchableOpacity>
      )}

      {/* History */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate('History', { hiveName })}
      >
        <Text style={styles.historyBtnText}>📊 View Scan History</Text>
      </TouchableOpacity>

      <Text style={styles.tip}>
        💡 Tip: Get close to the frame in good lighting for best results
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1007' },
  content: { padding: 20, alignItems: 'center' },
  title: {
    fontSize: 24, fontWeight: 'bold',
    color: '#F5A623', marginTop: 10
  },
  subtitle: {
    fontSize: 14, color: '#FDE8BB',
    opacity: 0.7, marginBottom: 20, textAlign: 'center'
  },
  imageBox: {
    width: '100%', height: 280, borderRadius: 16,
    overflow: 'hidden', marginBottom: 20,
    borderWidth: 1, borderColor: '#F5A623',
    backgroundColor: '#2C1D08',
  },
  previewImage: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center'
  },
  placeholderIcon: { fontSize: 60, marginBottom: 10 },
  placeholderText: { color: '#FDE8BB', opacity: 0.5 },
  primaryBtn: {
    width: '100%', padding: 16, borderRadius: 12,
    backgroundColor: '#F5A623', alignItems: 'center', marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 16, fontWeight: 'bold', color: '#1a1007'
  },
  secondaryBtn: {
    width: '100%', padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#F5A623',
    alignItems: 'center', marginBottom: 10,
  },
  secondaryBtnText: { fontSize: 16, color: '#F5A623' },
  analyzeBtn: {
    width: '100%', padding: 18, borderRadius: 12,
    backgroundColor: '#F5A623', alignItems: 'center',
    marginBottom: 10, marginTop: 6,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  analyzeBtnText: {
    fontSize: 18, fontWeight: 'bold', color: '#1a1007'
  },
  disabledBtn: { opacity: 0.6 },
  retakeBtn: {
    width: '100%', padding: 10,
    alignItems: 'center', marginBottom: 6,
  },
  retakeText: { color: '#FDE8BB', opacity: 0.5, fontSize: 13 },
  historyBtn: {
    width: '100%', padding: 14, borderRadius: 12,
    backgroundColor: '#2C1D08', alignItems: 'center',
    borderWidth: 1, borderColor: '#4A3010', marginTop: 6,
  },
  historyBtnText: { fontSize: 14, color: '#FDE8BB' },
  tip: {
    marginTop: 20, color: '#FDE8BB', opacity: 0.5,
    fontSize: 12, textAlign: 'center', lineHeight: 18,
  },
});