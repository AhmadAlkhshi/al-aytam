import { Box, Typography, Button, TextField } from '@mui/material';

/**
 * RTL Test Component
 * 
 * Simple component to verify RTL support is working correctly
 * Tests: text alignment, button layout, input fields, and Material-UI components
 */
export function RtlTest() {
  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        اختبار دعم RTL
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        هذا نص تجريبي باللغة العربية للتحقق من أن دعم RTL يعمل بشكل صحيح.
        يجب أن يظهر النص من اليمين إلى اليسار.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
        <Button variant="contained" color="primary">
          زر أساسي
        </Button>
        <Button variant="outlined" color="secondary">
          زر ثانوي
        </Button>
      </Box>

      <TextField
        fullWidth
        label="اسم الطالب"
        placeholder="أدخل اسم الطالب"
        sx={{ my: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Typography>البداية (يمين)</Typography>
        <Typography>النهاية (يسار)</Typography>
      </Box>
    </Box>
  );
}
