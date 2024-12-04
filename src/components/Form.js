import React, { useState } from 'react';
import axios from 'axios';

function Form() {
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Использование OpenStreetMap Nominatim для геокодирования
      const geocode = async (address) => {
        try {
          console.log(`Геокодирование адреса: ${address}`);
          const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
              q: address,
              format: 'json',
              limit: 1
            }
          });

          if (response.data.length > 0) {
            const { lat, lon } = response.data[0];
            console.log(`Координаты для ${address}: lat=${lat}, lon=${lon}`);
            return { lat, lon };
          } else {
            throw new Error(`Адрес не найден: ${address}`);
          }
        } catch (err) {
          console.error(`Ошибка при геокодировании адреса "${address}":`, err);
          throw err;
        }
      };

      // Получение координат начальной и конечной точки
      const startPoint = await geocode(startAddress);
      const endPoint = await geocode(endAddress);

      // Проверка на наличие координат перед отправкой на сервер
      if (!startPoint || !endPoint) {
        throw new Error('Не удалось получить координаты начальной или конечной точки');
      }

      // Отправка данных на сервер Flask
      console.log("Отправка данных на сервер Flask:", { start_point: startPoint, end_point: endPoint });
      const response = await axios.post('http://127.0.0.1:5000/predict', {
        start_point: startPoint,
        end_point: endPoint,
        num_nodes: 20, // Добавление параметра num_nodes
        num_edges: 40  // Добавление параметра num_edges
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Установка результата
      console.log("Ответ от сервера Flask:", response.data);
      setResult(response.data);
    } catch (err) {
      console.error('Ошибка при обработке:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div>
        <form onSubmit={handleSubmit}>
          <h3>Введите адреса начальной и конечной точки:</h3>
          <label>
            Начальный адрес:
            <input
                type="text"
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
                required
            />
          </label>
          <br />
          <label>
            Конечный адрес:
            <input
                type="text"
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
                required
            />
          </label>
          <br />
          <button type="submit" disabled={loading}>Отправить</button>
        </form>

        {loading && <p>Пожалуйста, подождите... Идет обработка данных.</p>}
        {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
        {result && (
            <div>
              <h3>Результаты:</h3>
              <p>Карта маршрута:</p>
              <iframe
                  src={`http://127.0.0.1:5000/${result.map_path}`}
                  title="Карта маршрута"
                  style={{ width: '1080px', height:   '720px', border: '1px solid black' }}
                  allowFullScreen
              />
            </div>
        )}
      </div>
  );

}

export default Form;
