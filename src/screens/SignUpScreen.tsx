import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sign Up</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.textPrimary, fontSize: 24 },
});
