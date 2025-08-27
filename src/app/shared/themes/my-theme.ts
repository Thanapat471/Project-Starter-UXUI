const MyThemePreset = {
  primitive: {
    'primary.500': '#ff4081',
    'secondary.500': '#00bcd4',
    'surface.100': '#f5f5f5',
    'text.900': '#222'
    // เพิ่ม token อื่น ๆ ตามต้องการ
  },
  semantic: {
    'primary.color': 'primary.500',
    'secondary.color': 'secondary.500',
    'surface.ground': 'surface.100',
    'text.color': 'text.900'
    // เพิ่ม mapping อื่น ๆ
  },
  components: {
    'button.background': 'primary.color',
    'inputtext.background': 'surface.ground'
    // เพิ่ม component token อื่น ๆ
  }
};

export default MyThemePreset;
