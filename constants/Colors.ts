/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Colors = {
  light: {
    text: '#2D3748',
    background: '#F7FAFC',
    tint: '#4C51BF',
    icon: '#718096',
    tabIconDefault: '#718096',
    tabIconSelected: '#4C51BF',
    // Kanban board renkleri
    backlog: '#EBF8FF',  // Açık mavi
    todo: '#F0FFF4',     // Açık yeşil
    inProgress: '#FAF5FF', // Açık mor
    test: '#FFF5F5',     // Açık kırmızı
    done: '#FFFFF0',     // Açık sarı
    // Kart renkleri
    cardBackground: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#F7FAFC',
    background: '#1A202C',
    tint: '#667EEA',
    icon: '#A0AEC0',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: '#667EEA',
    // Kanban board renkleri - dark mode
    backlog: '#2A4365',   // Koyu mavi
    todo: '#276749',      // Koyu yeşil
    inProgress: '#44337A', // Koyu mor
    test: '#742A2A',      // Koyu kırmızı
    done: '#744210',      // Koyu sarı
    // Kart renkleri
    cardBackground: '#2D3748',
    cardBorder: '#4A5568',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
  },
};
