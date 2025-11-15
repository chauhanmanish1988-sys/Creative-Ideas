import { initializeDatabase } from './database/connection';
import { createApp } from './app';

const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
