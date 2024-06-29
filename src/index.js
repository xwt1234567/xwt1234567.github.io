new Vue({
    el: '#app',
    data() {
        return {
            provinces: Object.keys(scenicSpotsData).map(province => ({
                province,
                spots: scenicSpotsData[province]
            })),
            selectedProvince: '连云港市',
            scenicSpots: [],
            scenicSpotsMarkers: [],
            week: '',
            date_show: '',
            time_show: '',
            adcode: '',
            weatherKey:'df513503ffbea83dd9cc20ab9a87f663',
            weatherData: null,
        };
    },
    methods: {
        getDateTime() {
            let wk = new Date().getDay();
            let yy = new Date().getFullYear();
            let mm = new Date().getMonth() + 1;
            let dd = new Date().getDate();
            let weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            this.week = weeks[wk];
            this.date_show = yy+"年"+mm+"月"+dd+"日";
        },
        getnewTime() {
            let hh = new Date().getHours();
            let mf = new Date().getMinutes() < 10 ? "0" + new Date().getMinutes() : new Date().getMinutes();
            let ss = new Date().getSeconds() < 10 ? "0" + new Date().getSeconds() : new Date().getSeconds();
            this.time_show = hh+":"+mf+":"+ss;
        },
        fetchData() {
            return new Promise((resolve, reject) => {
                axios.get('./src/scenicSpots.json')
                    .then(response => {
                        const data = response.data;
                        this.provinces = Object.keys(data).map(province => {
                            const provinceDetail = data[province];
                            return {
                                province,
                                latitude: provinceDetail.latitude,
                                longitude: provinceDetail.longitude,
                                adcode: provinceDetail.adcode,
                                spots: provinceDetail.scenic_spots
                            };
                        });
                        resolve(this.provinces);
                    })
                    .catch(error => {
                        reject(error);
                    });
            });
        },
        // 展示所选城市的景区位置
        showScenicSpots() {
            this.clearMarkers();
            const customIcon = L.icon({
                iconUrl: "./src/images/Location.png",
                iconSize: [40, 40],
                iconAnchor: [20, 40],
            });
            const selectedProvinceData = this.provinces.find(
                (province) => province.province === this.selectedProvince
            );
            if (!selectedProvinceData) {
                console.error("未找到所选省份的数据");
                return;
            }
            this.adcode = selectedProvinceData.adcode;
            const latitude = selectedProvinceData.latitude;
            const longitude = selectedProvinceData.longitude;
            map.flyTo([latitude, longitude], 10, { duration: 1 });
            console.log(this.latitude);
            console.log(this.adcode);
            this.scenicSpots = selectedProvinceData.spots;
            selectedProvinceData.spots.forEach((spot) => {
                const marker = L.marker([spot.latitude, spot.longitude], {
                    icon: customIcon,
                });
                marker.addTo(map);
                marker.bindPopup(`<h3 style='text-align: center'>${spot.name}</h3>`, {
                    offset: [0, -30],
                });
                marker.on("mouseover", function (e) {
                    this.openPopup();
                });
                marker.on("mouseout", function (e) {
                    this.closePopup();
                });
                this.scenicSpotsMarkers.push(marker);
            });
        },
        // 点击景区名称，在天地图中跳转到对应景区
        viewSpot(spot) {
            this.clearMarkers();
            map.flyTo([spot.latitude, spot.longitude], 15, { duration: 1 });
            const customIcon = L.icon({
                iconUrl: './src/images/Location.png',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
            });
            const marker = L.marker([spot.latitude, spot.longitude], { icon: customIcon });
            marker.bindPopup(`<h3 style="text-align: center">${spot.name}</h3>`, {
                offset: [0, -30],
            });
            marker.addTo(map);
            marker.openPopup();
            this.scenicSpotsMarkers.push(marker);
        },
        // 清除标记
        clearMarkers() {
            this.scenicSpotsMarkers.forEach(marker => {
                map.removeLayer(marker);
            });
            this.scenicSpotsMarkers = [];
        },
        //获取天气
        async fetchWeatherData() {
            try {
                const response = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${this.weatherKey}&city=${this.adcode}&extensions=base`);
                const data = await response.json();
                if (data.status === '1' && data.lives && data.lives.length > 0) {
                    this.weatherData = data.lives[0];
                    console.log(this.weatherData);
                } else {
                    console.error('未能获取天气信息:', data);
                }
            } catch (error) {
                console.error('获取天气信息出错:', error);
            }
        },
    },
    watch: {
        adcode(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.fetchWeatherData();
            }
        }
    },
    mounted() {
        this.getDateTime();
        setInterval(() => {
             this.getnewTime();
        }, 1000);
        setTimeout(() => {
            this.fetchData( ).then(() => {
                loadMap( );
                this.showScenicSpots( );
            }).catch(error => {
                console.error('获取数据时出错:', error);
            });
        },100) ;
    }
})

