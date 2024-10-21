import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const EmotionChart = () => {
  const [chartData, setChartData] = useState({});
  const [userToken, setUserToken] = useState('');

  useEffect(() => {
    // Load user token from local storage or authentication context
    const token = localStorage.getItem('userToken');
    if (token) {
      setUserToken(token);

      axios.get('/api/emotions/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => {
        const emotions = response.data.map(item => item.emotion);
        const timestamps = response.data.map(item => item.timestamp);

        setChartData({
          labels: timestamps,
          datasets: [
            {
              label: 'Emotional State Over Time',
              data: emotions,
              fill: false,
              borderColor: 'blue',
              tension: 0.1 // For a smoother line
            },
          ],
        });
      })
      .catch(error => {
        console.error("Error fetching emotion data:", error);
      });
    } else {
      console.error("User token not found");
    }
  }, []);

  return (
    <div>
      <h2>Your Emotional Health Progress</h2>
      {chartData && chartData.labels ? (
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      ) : (
        <p>Loading chart...</p>
      )}
    </div>
  );
};

export default EmotionChart;
