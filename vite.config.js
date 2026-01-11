
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
        about: resolve(__dirname, 'about.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        contact: resolve(__dirname, 'contact.html'),
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
})
