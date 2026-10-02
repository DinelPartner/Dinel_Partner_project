/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                obsidian: '#FFFFFF', // Was black, now white
                carbon: '#F8F9FA',   // Was dark gray, now very light gray/off-white
                accent: {
                    DEFAULT: '#EBB143', // Keep amber 
                    hover: '#D49D35',
                },
                light: '#1A1A1A',    // Was white text, now dark text
                muted: '#666666',    // Darker gray for text
                graphite: '#E5E7EB'  // Border color
            },
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
            },
            backgroundImage: {
                // Subtle light grid
                'grid-pattern': "linear-gradient(to right, #E5E7EB 1px, transparent 1px), linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)",
            }
        },
    },
    plugins: [],
}
