import axios from 'axios';

async function testSync() {
  const urls = [
    'https://apiv.gatherly.com.ng/temp_run_sql.php',
    'https://apiv.gatherly.com.ng/public/temp_run_sql.php',
    'https://apiv.gatherly.com.ng/api/temp_run_sql.php'
  ];
  for (const url of urls) {
    try {
      const res = await axios.get(url);
      console.log(`URL ${url} response length:`, res.data.length);
      console.log(`URL ${url} response starts with:`, String(res.data).substring(0, 100));
    } catch (e) {
      console.log(`URL ${url} failed:`, e.message);
    }
  }
}

testSync();
