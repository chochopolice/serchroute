let geocoder; // 住所化に使用
let map, panorama;
let marker = null;
let startLocation = null; // 起点地
let waypoints = []; // 経由地リスト（Directions用）
let waypointMarkers = [];  
let endLocation = null; // 終点地
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


function renderWaypoints() {
  const el = document.getElementById("waypoints-view");
  if (!el) return;

  if (waypoints.length === 0) {
    el.innerHTML = "なし";
    return;
  }

  el.innerHTML = waypoints
    .map((w, i) => `経由地${i + 1}: ${w.location.lat().toFixed(6)}, ${w.location.lng().toFixed(6)}`)
    .join("<br>");
}

function addWaypointMarker(latLng) {
  const m = new google.maps.Marker({
    position: latLng,
    map,
    label: `${waypointMarkers.length + 1}`, // 1,2,3... と番号
  });
  waypointMarkers.push(m);
}

document.getElementById("add-waypoint").addEventListener("click", () => {
  if (!marker || !marker.getPosition()) {
    alert("地点を検索またはマップ上で指定してください。");
    return;
  }
  const p = marker.getPosition();

  waypoints.push({ location: p, stopover: true });
  refreshWaypointMarkers();   // ここで番号も正しくなる
  updateRouteInfo();

  if (startLocation && endLocation) calculateRoute();
});

document.getElementById("clear-waypoints").addEventListener("click", () => {
  waypoints = [];
  refreshWaypointMarkers();
  updateRouteInfo();

  if (startLocation && endLocation) calculateRoute();
});


function updateRouteInfo() {
  // 起点
  document.getElementById("start-view").textContent =
    startLocation ? `${startLocation.lat().toFixed(6)}, ${startLocation.lng().toFixed(6)}` : "未設定";

  // 終点
  document.getElementById("end-view").textContent =
    endLocation ? `${endLocation.lat().toFixed(6)}, ${endLocation.lng().toFixed(6)}` : "未設定";

  // 経由地（複数）
  const wpList = document.getElementById("waypoints-view");
  wpList.innerHTML = ""; // 一旦クリア

  if (!waypoints || waypoints.length === 0) {
    const li = document.createElement("li");
    li.textContent = "なし";
    wpList.appendChild(li);
    return;
  }

  waypoints.forEach((w, i) => {
    const li = document.createElement("li");
    li.textContent = `${w.location.lat().toFixed(6)}, ${w.location.lng().toFixed(6)}`;
    wpList.appendChild(li);
  });
}


// 初期表示
renderWaypoints();

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
    geocoder = new google.maps.Geocoder();

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
            updateRouteInfo();

        } else {
            alert("地点を検索またはマップ上で指定してください。");
        }
    });

    // 終点設定
    document.getElementById("set-end").addEventListener("click", () => {
        if (marker && marker.getPosition()) {
            endLocation = marker.getPosition();
            alert("終点が設定されました。");
            updateRouteInfo();
            enableRouteSearch();
        } else {
            alert("地点を検索またはマップ上で指定してください。");
        }
    });

    // 経路検索
    document.getElementById("search-route").addEventListener("click", () => {
        if (startLocation && endLocation) {
            updateRouteInfo();
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
   // 起点終点を入れ替え
  const tmp = startLocation;
  startLocation = endLocation;
  endLocation = tmp;

  // ★経由地も逆順にする（復路）
  waypoints.reverse();

  refreshWaypointMarkers();
  updateRouteInfo();

  // ルート再計算
  calculateRoute();

//    const streetviewpButton = document.getElementById("start-streetview");
//	streetviewpButton.disabled = true;

        // 起点・終点の入れ替え後に再描画をトリガー
//        map.setCenter(startLocation);
//        marker.setPosition(startLocation);

        // 経路検索ボタンの状態を更新
//        enableRouteSearch();

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
            waypoints: waypoints,              // ★追加
            optimizeWaypoints: false,          // ★順番どおりに進みたいなら false

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
  updateRouteInfo();
}


function reverseGeocodeLatLng(latLng) {
  return new Promise((resolve) => {
    if (!geocoder) return resolve(null);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status !== "OK" || !results || results.length === 0) return resolve(null);

      // 一番上が「それっぽい」ことが多い。より短い名前が欲しければ調整可能
      resolve(results[0].formatted_address);
    });
  });
}



function addWaypointMarker(latLng) {
  const m = new google.maps.Marker({
    position: latLng,
    map,
    label: `${waypointMarkers.length + 1}`,
  });
  waypointMarkers.push(m);
}

function refreshWaypointMarkers() {
  // いったん消して作り直すのが確実
  waypointMarkers.forEach(m => m.setMap(null));
  waypointMarkers = [];

  waypoints.forEach((w, i) => {
    const m = new google.maps.Marker({
      position: w.location,
      map,
      label: `${i + 1}`,
    });
    waypointMarkers.push(m);
  });
}



async function updateRouteInfo() {
  // 起点/終点
  const startEl = document.getElementById("start-view");
  const endEl = document.getElementById("end-view");

  if (startEl) startEl.textContent = startLocation ? "取得中…" : "未設定";
  if (endEl) endEl.textContent = endLocation ? "取得中…" : "未設定";

  if (startLocation && startEl) {
    const addr = await reverseGeocodeLatLng(startLocation);
    startEl.textContent = addr || `${startLocation.lat().toFixed(6)}, ${startLocation.lng().toFixed(6)}`;
  }
  if (endLocation && endEl) {
    const addr = await reverseGeocodeLatLng(endLocation);
    endEl.textContent = addr || `${endLocation.lat().toFixed(6)}, ${endLocation.lng().toFixed(6)}`;
  }

  // 経由地リスト
  const listEl = document.getElementById("waypoints-view");
  const emptyEl = document.getElementById("waypoints-empty");
  if (!listEl) return;

  listEl.innerHTML = "";
  const hasWp = waypoints && waypoints.length > 0;
  if (emptyEl) emptyEl.style.display = hasWp ? "none" : "block";
  if (!hasWp) return;

  // 住所を順に取得して表示
  for (let i = 0; i < waypoints.length; i++) {
    const w = waypoints[i];
    const addr = await reverseGeocodeLatLng(w.location);
    const label = addr || `${w.location.lat().toFixed(6)}, ${w.location.lng().toFixed(6)}`;

    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "8px";
    li.style.marginBottom = "6px";

    const text = document.createElement("div");
    text.style.flex = "1";
    text.innerHTML = `<strong>${i + 1}.</strong> ${label}`;

    const btnUp = document.createElement("button");
    btnUp.textContent = "↑";
    btnUp.disabled = (i === 0);
    btnUp.addEventListener("click", () => {
      moveWaypoint(i, i - 1);
    });

    const btnDown = document.createElement("button");
    btnDown.textContent = "↓";
    btnDown.disabled = (i === waypoints.length - 1);
    btnDown.addEventListener("click", () => {
      moveWaypoint(i, i + 1);
    });

    const btnDel = document.createElement("button");
    btnDel.textContent = "×";
    btnDel.title = "削除";
    btnDel.addEventListener("click", () => {
      deleteWaypoint(i);
    });

    li.appendChild(text);
    li.appendChild(btnUp);
    li.appendChild(btnDown);
    li.appendChild(btnDel);
    listEl.appendChild(li);
  }
}

function deleteWaypoint(index) {
  if (index < 0 || index >= waypoints.length) return;

  waypoints.splice(index, 1);
  refreshWaypointMarkers();
  updateRouteInfo();

  // 起点終点が決まっていればルート再計算
  if (startLocation && endLocation) calculateRoute();
}

function moveWaypoint(from, to) {
  if (to < 0 || to >= waypoints.length) return;

  const [item] = waypoints.splice(from, 1);
  waypoints.splice(to, 0, item);

  refreshWaypointMarkers();
  updateRouteInfo();

  if (startLocation && endLocation) calculateRoute();
}


function setPovTowardNextPoint(currentPos, nextPos) {
  if (!currentPos || !nextPos) return;
  if (!google.maps.geometry || !google.maps.geometry.spherical) return;

  // current -> next の方角（度）を計算
  const heading = google.maps.geometry.spherical.computeHeading(currentPos, nextPos);

  // pitch/zoom は今の見た目を維持
  const pov = panorama.getPov() || { heading: 0, pitch: 0 };
  panorama.setPov({
    heading: heading,
    pitch: pov.pitch ?? 0,
  });
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
  if (moveInterval) clearInterval(moveInterval);

  moveInterval = setInterval(() => {
    if (currentIndex < route.length) {
      const position = route[currentIndex];
      panorama.setPosition(position);
      map.setCenter(position);

      // ★次の点があるなら、進行方向へ向ける
      const nextPos = (currentIndex + 1 < route.length) ? route[currentIndex + 1] : null;
      setPovTowardNextPoint(position, nextPos);

      currentIndex++;
    } else {
      clearInterval(moveInterval);
      alert("到着しました！");
    }
  }, 3000);
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