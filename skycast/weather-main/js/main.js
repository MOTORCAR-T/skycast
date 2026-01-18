let apiKey = "e182a713bc0ba39d08e5ab325dc06bda";

// Load weather based on user's location on index.html
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getWeatherByCoords, handleGeoError);
  } else {
    alert("Geolocation not supported by your browser.");
  }
});

// Handle geolocation-based weather fetch
async function getWeatherByCoords(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    updateUI(data);
    renderForecast(data);
  } catch (err) {
    console.error("Error fetching geolocation weather:", err);
  }
}

function handleGeoError(err) {
  console.warn("Geolocation error:", err.message);
  alert("Location access denied. Weather won't load automatically.");
}

// Handle search weather on search.html
const searchBtn = document.getElementById("search-btn");
if (searchBtn) {
  searchBtn.addEventListener("click", async function () {
    const loc = document.getElementById("city-input").value;
    if (!loc) {
      alert("Please enter a city name.");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${loc}&units=metric&appid=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.cod !== "200") {
        alert("City not found. Try another.");
        return;
      }

      updateUI(data);
      renderForecast(data);
    } catch (error) {
      console.error("Error fetching searched weather:", error);
      alert("Something went wrong. Try again.");
    }
  });
}

// Update main weather UI
function updateUI(data) {
  const cityMain = document.getElementById("city-name");
  const cityTemp = document.getElementById("metric");
  const weatherMain = document.querySelectorAll("#weather-main");
  const mainHumidity = document.getElementById("humidity");
  const mainFeel = document.getElementById("feels-like");
  const weatherImg = document.querySelector(".weather-icon");
  const weatherImgs = document.querySelector(".weather-icons");
  const tempMinWeather = document.getElementById("temp-min-today");
  const tempMaxWeather = document.getElementById("temp-max-today");

  // Calculate today's actual min/max from all forecast points
  const today = new Date().toLocaleDateString();
  let todayMin = Infinity;
  let todayMax = -Infinity;
  
  data.list.forEach(item => {
    const itemDate = new Date(item.dt * 1000).toLocaleDateString();
    if (itemDate === today) {
      const temp = item.main.temp;
      if (temp < todayMin) todayMin = temp;
      if (temp > todayMax) todayMax = temp;
    }
  });

  // Ensure that todayMin and todayMax are not the same
  if (todayMin === todayMax) {
    todayMax = todayMin + 1; // Adjust max if they are the same
  }

  cityMain.innerHTML = data.city.name;
  cityTemp.innerHTML = Math.floor(data.list[0].main.temp) + "°";
  weatherMain.forEach(el => el.innerHTML = data.list[0].weather[0].description);
  mainHumidity.innerHTML = Math.floor(data.list[0].main.humidity);
  mainFeel.innerHTML = Math.floor(data.list[0].main.feels_like);
  tempMinWeather.innerHTML = Math.round(todayMin) + "°";
  tempMaxWeather.innerHTML = Math.round(todayMax) + "°";

  const weatherCondition = data.list[0].weather[0].main.toLowerCase();
  let imgName = "sun";

  if (weatherCondition.includes("rain")) imgName = "rain";
  else if (weatherCondition.includes("cloud")) imgName = "cloud";
  else if (weatherCondition.includes("snow")) imgName = "snow";
  else if (weatherCondition.includes("mist") || weatherCondition.includes("fog")) imgName = "mist";
  else if (weatherCondition.includes("haze")) imgName = "haze";

  weatherImg.src = `img/${imgName}.png`;
  weatherImgs.src = `img/${imgName}.png`;
}

// Render 6-day forecast
function renderForecast(data) {
  const forecastBox = document.getElementById("forecast-box");
  if (!forecastBox) return;
  forecastBox.innerHTML = "";

  // Group forecasts by day
  const dailyForecasts = {};
  const today = new Date().toLocaleDateString();

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayStr = date.toLocaleDateString();
    
    // Skip if it's today (we already show today's weather separately)
    if (dayStr === today) return;

    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    
    if (!dailyForecasts[dayStr]) {
      dailyForecasts[dayStr] = {
        dayName: dayName,
        minTemp: item.main.temp,
        maxTemp: item.main.temp,
        icon: item.weather[0].icon,
        description: item.weather[0].main
      };
    } else {
      // Update min and max temps for the day
      if (item.main.temp < dailyForecasts[dayStr].minTemp) {
        dailyForecasts[dayStr].minTemp = item.main.temp;
      }
      if (item.main.temp > dailyForecasts[dayStr].maxTemp) {
        dailyForecasts[dayStr].maxTemp = item.main.temp;
      }
      // Use the midday weather icon (around 12:00 PM) for better representation
      const hours = date.getHours();
      if (hours >= 11 && hours <= 13) {
        dailyForecasts[dayStr].icon = item.weather[0].icon;
      }
    }
  });

  // Display the forecast (showing next 6 days)
  const forecastDays = Object.values(dailyForecasts).slice(0, 6);
  forecastDays.forEach(day => {
    forecastBox.innerHTML += `
      <div class="forecast-day">
        <p>${day.dayName}</p>
        <img src="http://openweathermap.org/img/wn/${day.icon}@2x.png" />
        <p>${Math.round(day.minTemp)}° / ${Math.round(day.maxTemp)}°</p>
      </div>
    `;
  });
}
