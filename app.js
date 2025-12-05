let map, panorama;
let marker = null;
let startLocation = null;
let endLocation = null;
let directionsService, directionsRenderer;
let moveInterval = null;
let currentIndex = 0;
let route = []; // 経路の座標リスト

        function initMap() {
            //const begin = {lat: -33.8742603, lng: 151.2095336}; // シドニーの地点
            //const begin = {lat: 36.113089, lng: -115.172833}; // ラスベガスの地点
            //const begin = {lat:  34.011282, lng: -118.493186}; // サンタモニカの地点
            //const begin = {lat: 28.3711967, lng: -81.5715294}; // WDWの地点
            const begin = {lat: 35.681236, lng: 139.767125}; //  東京駅の地点
            //const begin = {lat: -27.3733811, lng: -70.3351149}; // チリの地点

            map = new google.maps.Map(document.getElementById("map"), {

	        center: begin, //変数で指定
                //center: { lat: 35.681236, lng: 139.767125 }, // 直接指定（東京駅付近）
                zoom: 16
            });

    // ストリートビューの初期設定
            panorama = new google.maps.StreetViewPanorama(
                document.getElementById("street-view"),
                {
                    position: begin,
                    pov: { heading: 0, pitch: 0 },
                    zoom: 1
                }
            );


    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);


    map.setStreetView(panorama);

    // マーカー作成関数
    const createMarker = (position) => {
        if (marker) marker.setMap(null); // 既存のマーカーを削除
        marker = new google.maps.Marker({
            position,
            map: map,
        });
    };

    // マップクリック時のイベント
    map.addListener("click", (event) => {
        const position = event.latLng;
        createMarker(position);
    });

    // 検索ボックス設定(autocomplete：地点の検索と設定ができる）
    const locationInput = document.getElementById("location-input");
    const autocomplete = new google.maps.places.Autocomplete(locationInput);

    document.getElementById("search-location").addEventListener("click", () => {
        const place = autocomplete.getPlace();

        if (!place || !place.geometry) {
            alert("有効な地点を選択してください。");
            return;
        }

        const position = place.geometry.location;
        map.setCenter(position);
        map.setZoom(16);
        createMarker(position);
    });

    // 起点設定
    document.getElementById("set-start").addEventListener("click", () => {
        if (marker && marker.getPosition()) {
            startLocation = marker.getPosition();
            alert("起点が設定されました。");
            enableRouteSearch();
        } else {
            alert("地点を検索またはマップ上で指定してください。");
        }
    });

    // 終点設定
    document.getElementById("set-end").addEventListener("click", () => {
        if (marker && marker.getPosition()) {
            endLocation = marker.getPosition();
            alert("終点が設定されました。");
            enableRouteSearch();
        } else {
            alert("地点を検索またはマップ上で指定してください。");
        }
    });

    // 経路検索
    document.getElementById("search-route").addEventListener("click", () => {
        if (startLocation && endLocation) {
            calculateRoute();
        } else {
            alert("起点と終点を設定してください。");
        }
    const swaplocationpButton = document.getElementById("swap-locations");
	swaplocationpButton.disabled = false;

    });

    // ストリートビュー開始
    document.getElementById("start-streetview").addEventListener("click", () => {
        if (route.length > 0) {
            startStreetView();
        } else {
            alert("有効な経路がありません。");
        }
    });
}

// 起点と終点の入れ替えボタンのイベントリスナーを追加
document.getElementById("swap-locations").addEventListener("click", () => {
    if (startLocation && endLocation) {
        // 起点と終点を入れ替える
        const temp = startLocation;
        startLocation = endLocation;
        endLocation = temp;
        calculateRoute();

        // 起点と終点が入れ替わったことをユーザに知らせる
//        alert("起点と終点を入れ替えました。経路検索ボタンを再度押してください");


    const streetviewpButton = document.getElementById("start-streetview");
	streetviewpButton.disabled = true;

        // 起点・終点の入れ替え後に再描画をトリガー
        map.setCenter(startLocation);
        marker.setPosition(startLocation);

        // 経路検索ボタンの状態を更新
        enableRouteSearch();

    } else {
        alert("起点または終点が設定されていません。");
    }
});

// 起点または終点を設定した後にボタンを有効化
function enableRouteSearch() {
    const searchRouteButton = document.getElementById("search-route");
    const swapButton = document.getElementById("swap-locations");

    if (startLocation && endLocation) {
        searchRouteButton.disabled = false;
	streetviewpButton.disabled = false;
        swapButton.disabled = false; // 入れ替えボタンを有効化
    } else {
        swapButton.disabled = true; // 条件を満たさない場合は無効化
    }
}


function enableRouteSearch() {
    const searchRouteButton = document.getElementById("search-route");
    if (startLocation && endLocation) {
        searchRouteButton.disabled = false;
    }
}

function calculateRoute() {
    directionsService.route(
        {
            origin: startLocation,
            destination: endLocation,
	    //travelMode: google.maps.TravelMode.WALKING, // 移動手段：徒歩
            travelMode: google.maps.TravelMode.DRIVING, // 移動手段：車
        },
        (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
                route = extractRouteCoordinates(response);
                document.getElementById("start-streetview").disabled = false;
            } else {
                alert("経路情報を取得できませんでした: " + status);
            }
        }
    );
}

function extractRouteCoordinates(response) {
    const points = [];
    const legs = response.routes[0].legs;

//牛歩モード
//    legs.forEach((leg) => {
//        leg.steps.forEach((step) => {
//            step.path.forEach((pathPoint) => {
//                points.push(pathPoint);
//            });
//        });
//    });

//俊足モード
   legs.forEach((leg) => {
    leg.steps.forEach((step) => {
        step.path.forEach((pathPoint, index) => {
            // N番目の座標だけを取得 (例: 10点に1点を取得)
            if (index % 5 === 0) {
                points.push(pathPoint);
            }
        });
   
    });
   });

//疾風モード
//   legs.forEach((leg) => {
//    leg.steps.forEach((step) => {
//        step.path.forEach((pathPoint, index) => {
//            // N番目の座標だけを取得 (例: 10点に1点を取得)
//            if (index % 10 === 0) {
//                points.push(pathPoint);
//            }
//        });
//    });
//   });
    return points;
}

function startStreetView() {
    currentIndex = 0;

    moveInterval = setInterval(() => {
        if (currentIndex < route.length) {
            const position = route[currentIndex];
            panorama.setPosition(position);
            map.setCenter(position);
            currentIndex++;
        } else {
            clearInterval(moveInterval);
            alert("到着しました！");
        }
    }, 2000); // 2秒ごとに進行
}


// マップを初期化
window.onload = initMap;


//マップとストリートビューの初期化
//
//マップ (map) とストリートビュー (panorama) を Google Maps API を使用して初期化。
//起点は東京駅がデフォルト設定されています。
//地点の検索と設定
//
//ユーザが検索ボックスで地点を検索できるように設定 (autocomplete)。
//検索結果をマーカーとして地図上に表示。
//ユーザはマーカーを起点または終点として設定可能。
//経路検索
//
//起点と終点が設定された場合に経路を検索。
//Google Maps Directions API を使ってルート情報を取得。
//徒歩や車など、移動手段を指定可能。
//経路の簡略化
//
//経路情報から座標を抽出。
//「牛歩モード」と「俊足モード」の2種類の座標抽出方式を提供。
//俊足モードでは、指定間隔で座標を間引いています。
//ストリートビューでの自動進行
//
//ルート座標に従って、ストリートビュー画面を自動的に進行。
//各座標に移動するたびに地図の中心も更新。
//ユーザインタラクション
//
//起点・終点の設定、経路検索、ストリートビュー開始などのボタン操作で各機能を制御。