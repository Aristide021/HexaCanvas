// Mock AI service - in production this would connect to Bolt.ai
export class AIService {
  private static themes = [
    'sunset', 'ocean', 'forest', 'space', 'fire', 'ice', 'earth', 'sky',
    'neon', 'pastel', 'monochrome', 'vibrant', 'dark', 'light', 'warm', 'cool'
  ];

  private static palettes: Record<string, string[]> = {
    sunset: ['#FF6B35', '#F7931E', '#FFD23F', '#EE4B2B', '#C21807'],
    ocean: ['#006A6B', '#0092A8', '#4FC3F7', '#B3E5FC', '#E1F5FE'],
    forest: ['#2E7D32', '#4CAF50', '#81C784', '#C8E6C9', '#E8F5E9'],
    space: ['#1A237E', '#3F51B5', '#7986CB', '#C5CAE9', '#E8EAF6'],
    fire: ['#BF360C', '#FF5722', '#FF8A65', '#FFAB91', '#FFCCBC'],
    ice: ['#0D47A1', '#42A5F5', '#90CAF9', '#BBDEFB', '#E3F2FD'],
    earth: ['#3E2723', '#795548', '#A1887F', '#D7CCC8', '#EFEBE9'],
    sky: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5'],
    neon: ['#FF0080', '#00FF80', '#8000FF', '#FF8000', '#0080FF'],
    pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
    monochrome: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'],
    vibrant: ['#FF1744', '#FF6D00', '#FFEA00', '#00E676', '#2979FF'],
    dark: ['#121212', '#1E1E1E', '#2D2D2D', '#404040', '#5A5A5A'],
    light: ['#FFFFFF', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD'],
    warm: ['#FF8A80', '#FFAB40', '#FFD54F', '#AED581', '#4FC3F7'],
    cool: ['#80DEEA', '#80CBC4', '#A5D6A7', '#C5E1A5', '#DCEDC8']
  };

  private static getRandomPalette(): string[] {
    const colors = [];
    for (let i = 0; i < 5; i++) {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 60 + Math.floor(Math.random() * 40);
      const lightness = 40 + Math.floor(Math.random() * 40);
      colors.push(this.hslToHex(hue, saturation, lightness));
    }
    return colors;
  }

  private static hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  private static findClosestTheme(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    for (const theme of this.themes) {
      if (lowerPrompt.includes(theme)) {
        return theme;
      }
    }

    // Check for color names
    const colorMap: Record<string, string> = {
      'red': 'fire',
      'blue': 'ocean',
      'green': 'forest',
      'purple': 'space',
      'orange': 'sunset',
      'yellow': 'sunset',
      'pink': 'pastel',
      'black': 'dark',
      'white': 'light',
      'gray': 'monochrome',
      'grey': 'monochrome'
    };

    for (const [color, theme] of Object.entries(colorMap)) {
      if (lowerPrompt.includes(color)) {
        return theme;
      }
    }

    return 'vibrant'; // default
  }

  static async generatePalette(prompt: string): Promise<string[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      // In a real implementation, this would call Bolt.ai
      // const response = await ai.generate(`Generate a 5-color hex palette for theme "${prompt}". Output JSON array only.`);
      
      const theme = this.findClosestTheme(prompt);
      let palette = this.palettes[theme];
      
      if (!palette) {
        palette = this.getRandomPalette();
      }

      // Add some randomness to avoid identical results
      if (Math.random() > 0.7) {
        palette = this.getRandomPalette();
      }

      return palette;
    } catch (error) {
      console.error('AI palette generation failed:', error);
      // Fallback palette
      return ['#FF5733', '#C70039', '#900C3F', '#581845', '#273746'];
    }
  }

  static async suggestThemes(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return a mix of themes with some randomness
    const shuffled = [...this.themes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }
}