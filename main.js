// Seleccionar elementos del DOM usando los IDs específicos

/*
Aquí estamos obteniendo referencias a todos los elementos HTML que vamos 
a necesitar manipular. Usamos getElementById() para obtener cada elemento por su ID único.
*/
const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const weatherIconElement = document.getElementById('weatherIcon');
const humidityElement = document.getElementById('humidity');
const precipitationElement = document.getElementById('precipitation');
const windSpeedElement = document.getElementById('windSpeed');
const airQualityElement = document.getElementById('airQuality');
const dayElement = document.getElementById('day');
const dateElement = document.getElementById('date');
const timeElement = document.getElementById('time');

// Clave de la API de Unsplash
const unsplashApiKey = 'Ob9RsrjNi9uTe5usIThXR392zDmdUTWfVMfq8l9cNdE'; // Reemplaza con tu propia clave

// Función para obtener una imagen de Unsplash en base a la ciudad
async function getCityImage(city) {
    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${city}&client_id=${unsplashApiKey}&per_page=1`);
        const data = await response.json();

        if (data.results.length > 0) {
            // Si encontramos una imagen, devolver la URL
            return data.results[0].urls.regular;
        } else {
            // Si no se encuentra una imagen, devolver una predeterminada
            return 'https://via.placeholder.com/800x400?text=Imagen+no+disponible';
        }
    } catch (error) {
        console.error('Error obteniendo imagen:', error);
        return 'https://via.placeholder.com/800x400?text=Imagen+no+disponible'; // Imagen de fallback
    }
}


/*
Esta es la clave necesaria para hacer peticiones a la API de OpenWeatherMap.
*/
// API key y URL base
const apiKey = 'ed46f19ea192bad68ab0c13c479fe460';

// Función para obtener datos del clima
// Es async porque hace peticiones a una API
// Recibe el nombre de una ciudad
async function getWeatherData(city) {
    try {
        // Obtener datos básicos del clima
        // Primera petición para datos del clima
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`
        );
        const weatherData = await weatherResponse.json();

        if (weatherData.cod === '404') {
            throw new Error('Ciudad no encontrada');
        }

        // Obtener datos de calidad del aire
        // Segunda petición para calidad del aire
        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;
        const airQualityResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const airQualityData = await airQualityResponse.json();

        return {
            weather: weatherData,
            airQuality: airQualityData
        };
    } catch (error) {
        console.error('Error:', error);
        alert('Error al obtener datos del clima: ' + error.message);
    }
}

// Función para actualizar el icono del clima
// Recibe un código de clima de la API
function updateWeatherIcon(weatherCode) {
    // Mapeo básico de códigos de clima a texto descriptivo
    // Tiene un objeto que mapea códigos a emojis
    const weatherIcons = {
        '01': '☀️', // Despejado
        '02': '🌤️', // Pocas nubes
        '03': '☁️', // Nubes dispersas
        '04': '☁️', // Nublado
        '09': '🌧️', // Lluvia ligera
        '10': '🌧️', // Lluvia
        '11': '⛈️', // Tormenta
        '13': '🌨️', // Nieve
        '50': '🌫️', // Neblina
    };
    
    // Extrae los primeros dos caracteres del código
    const iconCode = weatherCode.substring(0, 2);
    // Actualiza el elemento del icono con el emoji correspondiente
    weatherIconElement.textContent = weatherIcons[iconCode] || '❓';
}

// Función para actualizar la interfaz
async function updateUI(data) {
    if (!data) return;

    const { weather, airQuality } = data;

    // Actualizar ubicación
    locationElement.textContent = `${weather.name}, ${weather.sys.country}`;

    // Actualizar temperatura
    temperatureElement.textContent = `${Math.round(weather.main.temp)}°C`;

    // Actualizar icono del clima
    updateWeatherIcon(weather.weather[0].icon);

    // Actualizar condiciones
    humidityElement.textContent = `Humedad: ${weather.main.humidity}%`;
    
    // Precipitación
    const precipitation = weather.rain ? `${weather.rain['1h']} mm` : '0 mm';
    precipitationElement.textContent = `Precipitación: ${precipitation}`;
    
    // Velocidad del viento
    windSpeedElement.textContent = `Viento: ${Math.round(weather.wind.speed)} m/s`;
    
    // Calidad del aire
    const aqiIndex = airQuality.list[0].main.aqi;
    const aqiText = ['Buena', 'Regular', 'Moderada', 'Mala', 'Muy mala'][aqiIndex - 1];
    airQualityElement.textContent = `Calidad: ${aqiText}`;

    // Obtener la imagen de la ciudad desde Unsplash
    const cityImageUrl = await getCityImage(weather.name);
    const illustrationElement = document.querySelector('.illustration');

    // Establecer la imagen de fondo de la ciudad
    illustrationElement.style.backgroundImage = `url(${cityImageUrl})`;
    illustrationElement.style.backgroundSize = 'cover';
    illustrationElement.style.backgroundPosition = 'center';
    illustrationElement.style.height = '200px'; // Ajusta la altura según sea necesario

    updateDateTime();
}


// Función para actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    dayElement.textContent = days[now.getDay()];
    dateElement.textContent = now.toLocaleDateString('es-ES');
    timeElement.textContent = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Event listener para el botón de búsqueda
searchButton.addEventListener('click', async () => {
    const city = locationInput.value.trim();
    if (city) {
        // Llaman a getWeatherData con la ciudad
        const data = await getWeatherData(city);
        // Actualizan la interfaz con los nuevos datos
        updateUI(data);
    }
});

// Event listener para la búsqueda con Enter
locationInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const city = locationInput.value.trim();
        if (city) {
            const data = await getWeatherData(city);
            updateUI(data);
        }
    }
});

// Actualizar la hora cada minuto
setInterval(updateDateTime, 60000);

// Cargar datos iniciales
document.addEventListener('DOMContentLoaded', async () => {
    const data = await getWeatherData('Oaxaca');
    updateUI(data);
});

/*

// Modificar la función updateDateTime para aceptar el timezone
function updateDateTime(timezone = 0) { // timezone en segundos desde la API
    // Obtener la hora actual en UTC
    const now = new Date();
    
    // Convertir a la hora local de la ciudad seleccionada
    const localTime = new Date(now.getTime() + (timezone * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    dayElement.textContent = days[localTime.getDay()];
    dateElement.textContent = localTime.toLocaleDateString('es-ES');
    timeElement.textContent = localTime.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Modificar la función updateUI para pasar el timezone
function updateUI(data) {
    if (!data) return;

    const { weather, airQuality } = data;

    // Actualizar ubicación
    locationElement.textContent = `${weather.name}, ${weather.sys.country}`;

    // Actualizar temperatura
    temperatureElement.textContent = `${Math.round(weather.main.temp)}°C`;

    // Actualizar icono del clima
    updateWeatherIcon(weather.weather[0].icon);

    // Actualizar condiciones
    humidityElement.textContent = `Humedad: ${weather.main.humidity}%`;
    
    // Precipitación
    const precipitation = weather.rain ? `${weather.rain['1h']} mm` : '0 mm';
    precipitationElement.textContent = `Precipitación: ${precipitation}`;
    
    // Velocidad del viento
    windSpeedElement.textContent = `Viento: ${Math.round(weather.wind.speed)} m/s`;
    
    // Calidad del aire
    const aqiIndex = airQuality.list[0].main.aqi;
    const aqiText = ['Buena', 'Regular', 'Moderada', 'Mala', 'Muy mala'][aqiIndex - 1];
    airQualityElement.textContent = `Calidad: ${aqiText}`;

    // Actualizar fecha y hora con el timezone de la ubicación
    updateDateTime(weather.timezone);
}

// Modificar el intervalo para que use el último timezone conocido
let currentTimezone = 0; // Variable para almacenar el último timezone

// Actualizar la función de intervalo
setInterval(() => {
    updateDateTime(currentTimezone);
}, 60000);

// Modificar el event listener del botón de búsqueda
searchButton.addEventListener('click', async () => {
    const city = locationInput.value.trim();
    if (city) {
        const data = await getWeatherData(city);
        if (data) {
            currentTimezone = data.weather.timezone; // Guardar el nuevo timezone
            updateUI(data);
        }
    }
});

// Modificar el event listener de la tecla Enter
locationInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const city = locationInput.value.trim();
        if (city) {
            const data = await getWeatherData(city);
            if (data) {
                currentTimezone = data.weather.timezone; // Guardar el nuevo timezone
                updateUI(data);
            }
        }
    }
});

// Modificar la carga inicial
document.addEventListener('DOMContentLoaded', async () => {
    const data = await getWeatherData('Oaxaca');
    if (data) {
        currentTimezone = data.weather.timezone; // Guardar el timezone inicial
        updateUI(data);
    }
});
*/
