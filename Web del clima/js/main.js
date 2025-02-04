// Seleccionar elementos del DOM usando los IDs específicos
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

const weatherIconMap = {
    "clear": "01d",
    "pcloudy": "02d",
    "mcloudy": "03d",
    "cloudy": "04d",
    "humid": "50d",
    "lightrain": "09d",
    "oshower": "09d",
    "ishower": "09d",
    "lightsnow": "13d",
    "rain": "10d",
    "snow": "13d",
    "tsrain": "11d"
};

// Clave de la API de Unsplash
const unsplashApiKey = 'Ob9RsrjNi9uTe5usIThXR392zDmdUTWfVMfq8l9cNdE'; // Reemplaza con tu propia clave

// API key y URL base
const apiKey = 'ad8cbc4362b9d57c1dd95744657065e9';

// Función para obtener una imagen de Unsplash en base a la ciudad
async function getCityImage(city) {
    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${city}&client_id=${unsplashApiKey}&per_page=1`);
        const data = await response.json();

        if (data.results.length > 0) {
            return data.results[0].urls.regular;
        } else {
            return 'https://via.placeholder.com/800x400?text=Imagen+no+disponible';
        }
    } catch (error) {
        console.error('Error obteniendo imagen:', error);
        return 'https://via.placeholder.com/800x400?text=Imagen+no+disponible';
    }
}

// Función para obtener datos del clima
async function getWeatherData(city) {
    try {
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`
        );
        const weatherData = await weatherResponse.json();

        if (weatherData.cod === '404') {
            throw new Error('Ciudad no encontrada');
        }

        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;
        const airQualityResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const airQualityData = await airQualityResponse.json();

        const sevenTimerResponse = await fetch(
            `http://www.7timer.info/bin/civillight.php?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json`
        );
        const sevenTimerData = await sevenTimerResponse.json();

        return {
            weather: weatherData,
            airQuality: airQualityData,
            sevenTimer: sevenTimerData,
            coordinates: { lat, lon } // Pasamos las coordenadas
        };
    } catch (error) {
        console.error('Error:', error);
        alert('Error al obtener datos del clima: ' + error.message);
    }
}

// Función para actualizar el icono del clima
function updateWeatherIcon(weatherCode) {
    const weatherIcons = {
        '01': '☀️',
        '02': '🌤️',
        '03': '☁️',
        '04': '☁️',
        '09': '🌧️',
        '10': '🌧️',
        '11': '⛈️',
        '13': '🌨️',
        '50': '🌫️',
    };

    const iconCode = weatherCode.slice(0, 2);
    weatherIconElement.textContent = weatherIcons[iconCode] || '❓';
}

// Actualizamos la UI
async function updateUI(data) {
    if (!data) return;

    const { weather, airQuality, sevenTimer, coordinates } = data;

    locationElement.textContent = `${weather.name}, ${weather.sys.country}`;
    temperatureElement.textContent = `${Math.round(weather.main.temp)}°C`;
    updateWeatherIcon(weather.weather[0].icon);
    humidityElement.textContent = `Humedad: ${weather.main.humidity}%`;
    const precipitation = weather.rain ? `${weather.rain['1h']} mm` : '0 mm';
    precipitationElement.textContent = `Precipitación: ${precipitation}`;
    windSpeedElement.textContent = `Viento: ${Math.round(weather.wind.speed)} m/s`;
    const aqiIndex = airQuality.list[0].main.aqi;
    const aqiText = ['Buena', 'Regular', 'Moderada', 'Mala', 'Muy mala'][aqiIndex - 1];
    airQualityElement.textContent = `Calidad: ${aqiText}`;

    // Actualizar las recomendaciones basadas en los datos reales
    actualizarRecomendaciones(weather);

    // Obtener la imagen de la ciudad desde Unsplash
    const cityImageUrl = await getCityImage(weather.name);
    const illustrationElement = document.querySelector('.illustration');
    illustrationElement.style.backgroundImage = `url(${cityImageUrl})`;
    illustrationElement.style.backgroundSize = 'cover';
    illustrationElement.style.backgroundPosition = 'center';
    illustrationElement.style.height = '200px';

    updateDateTime();
    updatePronostico(sevenTimer);
    inicializarMapaMeteorologico(coordinates); // Inicializa el mapa aquí
}

function updatePronostico(data) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let i = 0;
    while (i < 5) {
        const day = data.dataseries[i].date.toString(); // Convertir a string
        const tempMax = data.dataseries[i].temp2m.max;
        const tempMin = data.dataseries[i].temp2m.min;
        const weatherCode = data.dataseries[i].weather;

        const año = parseInt(day.substring(0, 4));
        const mes = parseInt(day.substring(4, 6)) - 1; // Restar 1 porque los meses en JS van de 0 a 11
        const dia = parseInt(day.substring(6, 8));

        const fecha = new Date(año, mes, dia);
        const nombreDia = days[fecha.getDay()];

        const iconCode = weatherIconMap[weatherCode] || "01d";
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        document.getElementById(`day${i}`).textContent = nombreDia;
        document.getElementById(`Pronostico${i}temperature`).textContent = `Max ${tempMax} °C - Min ${tempMin} °C`;
        document.getElementById(`imgp${i}`).src = iconUrl;
        i++;
    }
}

// Función para actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    dayElement.textContent = days[now.getDay()];
    dateElement.textContent = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    timeElement.textContent = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    });

    const radarDayElement = document.getElementById("radar-day");
    const radarDateElement = document.getElementById("radar-date");
    const radarTimeElement = document.getElementById("radar-time");

    if (radarDayElement && radarDateElement && radarTimeElement) {
        radarDayElement.textContent = days[now.getDay()];
        radarDateElement.textContent = dateElement.textContent;
        radarTimeElement.textContent = timeElement.textContent;
    }
}

// Ejecutar la función al cargar la página
updateDateTime();
setInterval(updateDateTime, 1000);

// Event listener para el botón de búsqueda
searchButton.addEventListener('click', async () => {
    const city = locationInput.value.trim();
    if (city) {
        const data = await getWeatherData(city);
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

// Inicializar el mapa meteorológico
const apiKeyRadar = 'a28bcf65d1400503f4df0f0d5ed24961';

let map = null; // Variable para almacenar la instancia del mapa

function inicializarMapaMeteorologico(coordinates) {
    console.log("Actualizando el mapa en:", coordinates);

    if (!map) {
        // Si el mapa no existe, créalo
        map = L.map('radarMap').setView([coordinates.lat, coordinates.lon], 6);

        // Capa base de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
        }).addTo(map);

        // Definir capas meteorológicas de OpenWeatherMap
        const capasMeteorologicas = {
            "🌡️ Temperatura": L.tileLayer(
                `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKeyRadar}`, {
                    attribution: '&copy; OpenWeatherMap',
                    maxZoom: 19,
                    opacity: 0.5
                }
            ),
            "☁️ Nubes": L.tileLayer(
                `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKeyRadar}`, {
                    attribution: '&copy; OpenWeatherMap',
                    maxZoom: 19,
                    opacity: 0.5
                }
            ),
            "🌧️ Precipitación": L.tileLayer(
                `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKeyRadar}`, {
                    attribution: '&copy; OpenWeatherMap',
                    maxZoom: 19,
                    opacity: 0.5
                }
            ),
            "💨 Viento": L.tileLayer(
                `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKeyRadar}`, {
                    attribution: '&copy; OpenWeatherMap',
                    maxZoom: 19,
                    opacity: 0.5
                }
            )
        };

        // Agregar la capa de temperatura por defecto
        capasMeteorologicas["🌡️ Temperatura"].addTo(map);

        // Agregar control de capas
        L.control.layers(null, capasMeteorologicas, { collapsed: false }).addTo(map);
    } else {
        // Si el mapa ya existe, solo actualiza la vista
        map.setView([coordinates.lat, coordinates.lon], 6);
    }
}


// Seleccionar todos los botones y secciones
const buttons = document.querySelectorAll('.toggle-btn');
const sections = document.querySelectorAll('.emergent-section');

// Añadir evento de clic a cada botón
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);

        sections.forEach(section => {
            if (section !== targetSection) {
                section.classList.remove('visible');
            }
        });

        targetSection.classList.toggle('visible');
    });
});

// Seleccionar los elementos de la sección de recomendaciones
const mensajeDinamico = document.getElementById("mensajeDinamico");
const imagenIlustrativa = document.getElementById("imagenIlustrativa");
const recomendacionUno = document.getElementById("recomendacionUno");
const recomendacionDos = document.getElementById("recomendacionDos");
const recomendacionTres = document.getElementById("recomendacionTres");

// Función para obtener un mensaje aleatorio de una lista
function obtenerMensajeAleatorio(mensajes) {
    return mensajes[Math.floor(Math.random() * mensajes.length)];
}

function actualizarRecomendaciones(weatherData) {
    const temperatura = weatherData.main.temp;
    const clima = weatherData.weather[0].description.toLowerCase();

    let mensajes = [];
    let imagenSrc = "";
    let recomendaciones = [];

    if (clima.includes("clouds")) {
        mensajes = [
            "El cielo está nublado, pero sigue siendo un buen día.",
            "Cielos cubiertos, pero la temperatura es agradable.",
            "Un día tranquilo con nubes, perfecto para descansar."
        ];
        imagenSrc = "images/cloudy.png";
        recomendaciones = [
            "Aprovecha para hacer actividades en interiores.",
            "Es un buen día para leer o disfrutar de una película.",
            "Mantén un abrigo cerca, ya que la temperatura podría bajar."
        ];
    } else if (temperatura >= 30) {
        mensajes = [
            "¡Hace mucho calor! Mantente hidratado.",
            "El sol está muy fuerte hoy, usa protector solar.",
            "Perfecto para una piscina o playa, ¡pero cuida tu piel!"
        ];
        imagenSrc = "images/sunny.png";
        recomendaciones = [
            "Bebe mucha agua.",
            "Usa ropa ligera y cómoda.",
            "No olvides el protector solar si vas a estar al aire libre."
        ];
    } else if (temperatura >= 20 && temperatura < 30) {
        mensajes = [
            "Día agradable, ideal para actividades al aire libre.",
            "El clima está perfecto para caminar o andar en bicicleta.",
            "Un día cálido, pero no excesivo. ¡Aprovecha el día!"
        ];
        imagenSrc = "images/clear-sky.png"; 
        recomendaciones = [
            "Disfruta de una caminata o paseo.",
            "Usa ropa ligera, pero no olvides una chaqueta ligera por la noche.",
            "Lleva agua para mantenerte hidratado."
        ];
    } else if (temperatura >= 10 && temperatura < 20) {
        mensajes = [
            "Temperatura fresca, es un buen día para actividades en exteriores.",
            "Hace algo de frío, pero nada que no se pueda disfrutar.",
            "Perfecto para una caminata ligera en el parque."
        ];
        imagenSrc = "images/cloudy.png"; 
        recomendaciones = [
            "Lleva una chaqueta ligera.",
            "Aprovecha para hacer ejercicio al aire libre.",
            "No olvides protegerte del viento si estás cerca de la costa."
        ];
    } else if (temperatura < 10) {
        mensajes = [
            "Hace frío, ¡es hora de abrigarse!",
            "Un día muy frío, ideal para quedarse en casa o disfrutar del invierno.",
            "¡La temperatura está baja! Mantente caliente."
        ];
        imagenSrc = "images/snowy.png";
        recomendaciones = [
            "Usa ropa abrigada como bufandas, gorros y guantes.",
            "Mantén las actividades al aire libre cortas para evitar resfriados.",
            "Si vas a salir, asegúrate de llevar una chaqueta gruesa."
        ];
    }

    const mensajeSeleccionado = obtenerMensajeAleatorio(mensajes);
    mensajeDinamico.textContent = mensajeSeleccionado;
    imagenIlustrativa.innerHTML = `<img src="${imagenSrc}" alt="Clima">`;
    recomendacionUno.textContent = recomendaciones[0];
    recomendacionDos.textContent = recomendaciones[1];
    recomendacionTres.textContent = recomendaciones[2];
}

// Llamar a la función para actualizar las recomendaciones
document.addEventListener('DOMContentLoaded', async () => {
    const data = await getWeatherData('Oaxaca');
    updateUI(data);
    actualizarRecomendaciones(data.weather);
});