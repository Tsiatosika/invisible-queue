import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleY = useRef(new Animated.Value(30)).current
  const subtitleOpacity = useRef(new Animated.Value(0)).current
  const dotsOpacity = useRef(new Animated.Value(0)).current
  const screenOpacity = useRef(new Animated.Value(1)).current
  const dot1 = useRef(new Animated.Value(0.3)).current
  const dot2 = useRef(new Animated.Value(0.3)).current
  const dot3 = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1, tension: 50, friction: 5, useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0, duration: 400, useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
      Animated.timing(dotsOpacity, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
    ]).start()

    const dotAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ])
    )
    dotAnim.start()

    setTimeout(() => {
      dotAnim.stop()
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 600, useNativeDriver: true,
      }).start(() => onFinish())
    }, 2800)

    return () => dotAnim.stop()
  }, [])

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
      <View style={styles.bg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <Animated.View style={[styles.logoContainer, {
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
        }]}>
          <View style={styles.logoBox}>
            <Ionicons name="list" size={52} color="#fff" />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, {
          opacity: titleOpacity,
          transform: [{ translateY: titleY }],
        }]}>
          Invisible Queue
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Gérez vos files d'attente{'\n'}virtuellement
        </Animated.Text>

        <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </Animated.View>

        <Animated.Text style={[styles.version, { opacity: subtitleOpacity }]}>
          v1.0 MVP
        </Animated.Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  bg: {
    flex: 1,
    backgroundColor: '#312e81',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -100, right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 80, left: -80,
  },
  circle3: {
    position: 'absolute',
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30, right: 60,
  },
  logoContainer: { marginBottom: 28 },
  logoBox: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 38, fontWeight: '900',
    color: '#fff', letterSpacing: 0.5, marginBottom: 10,
  },
  subtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 22,
    marginBottom: 48, paddingHorizontal: 40,
  },
  dotsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 48,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff',
  },
  version: {
    position: 'absolute', bottom: 36,
    fontSize: 12, color: 'rgba(255,255,255,0.35)',
  },
})
