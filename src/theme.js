// src/theme.js
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    heading: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Courier New', monospace",
  },
  fontWeights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  components: {
    Heading: {
      variants: {
        pageTitle: {
          fontSize: "35px",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 6,
        },
      },
    },
  },
  styles: {
    global: {
      'html, body, #root': {
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: '#f0f4f8',
      },
      body: {
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#2c3e50',
      },
      'h1, h2, h3, h4, h5, h6': {
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontWeight: 700,
      },
      button: {
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      input: {
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      select: {
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      textarea: {
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
    },
  },
});

export default theme;
