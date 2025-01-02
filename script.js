// Débogage et utilitaires
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[BURGER-PIZZA DEBUG]', ...args);
    }
}

// Gestion de la carte de livraison
class DeliveryMapManager {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.restaurantCoords = [36.7507, 5.0556];
        this.restaurantAddress = "10 Naciriya, Cité 196 Logements, Bâtiment 06, Béjaïa, Algérie";
    }

    initMap() {
        debugLog('Tentative d\'initialisation de la carte');
        
        const mapContainer = document.getElementById('delivery-map');
        const locateMeBtn = document.getElementById('locate-me');

        if (!mapContainer) {
            debugLog('Conteneur de carte introuvable');
            return false;
        }

        try {
            this.map = L.map(mapContainer, {
                center: this.restaurantCoords,
                zoom: 15,
                attributionControl: true,
                zoomControl: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: ' OpenStreetMap contributors'
            }).addTo(this.map);

            this.geocodeRestaurantLocation();
            this.setupLocationTracking(locateMeBtn);

            debugLog('Carte initialisée avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la carte :', error);
            return false;
        }
    }

    geocodeRestaurantLocation() {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.restaurantAddress)}`;

        fetch(nominatimUrl)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);

                    this.map.setView([lat, lon], 15);
                    L.marker([lat, lon])
                        .addTo(this.map)
                        .bindPopup(this.restaurantAddress)
                        .openPopup();

                    debugLog('Localisation du restaurant géocodée :', lat, lon);
                } else {
                    debugLog('Aucune coordonnée trouvée pour l\'adresse');
                    this.map.setView(this.restaurantCoords, 15);
                }
            })
            .catch(error => {
                console.error('Erreur de géocodage :', error);
                this.map.setView(this.restaurantCoords, 15);
            });
    }

    setupLocationTracking(locateMeBtn) {
        if (!locateMeBtn) {
            debugLog('Bouton de localisation non trouvé');
            return;
        }

        locateMeBtn.addEventListener('click', () => {
            debugLog('Bouton "Me localiser" cliqué');
            
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            this.map.locate(options);
        });

        this.map.on('locationfound', (e) => {
            debugLog('Position trouvée :', e.latlng);

            if (this.userMarker) {
                this.map.removeLayer(this.userMarker);
            }

            this.userMarker = L.marker(e.latlng)
                .addTo(this.map)
                .bindPopup('Votre position')
                .openPopup();

            this.map.setView(e.latlng, 15);

            const distance = this.map.distance(this.restaurantCoords, e.latlng);
            alert(`Distance du restaurant : ${(distance / 1000).toFixed(2)} km`);
        });

        this.map.on('locationerror', (e) => {
            console.error('Erreur de localisation :', e);
            alert("Impossible de vous localiser. Veuillez vérifier vos paramètres.");
        });
    }
}

// Initialisation globale
function initializeApplication() {
    debugLog('Initialisation de l\'application');

    const orderBtn = document.querySelector('.order-btn');
    const orderModal = document.getElementById('orderModal');

    if (!orderBtn || !orderModal) {
        debugLog('Éléments essentiels manquants');
        return;
    }

    const deliveryMapManager = new DeliveryMapManager();

    orderBtn.addEventListener('click', () => {
        debugLog('Bouton de commande cliqué');
        
        const cart = JSON.parse(localStorage.getItem('cart') || '{}');
        if (cart.items && cart.items.length > 0 && cart.total > 0) {
            orderModal.style.display = 'block';
            
            setTimeout(() => {
                deliveryMapManager.initMap();
            }, 200);
        } else {
            alert('Votre panier est vide !');
        }
    });

    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            orderModal.style.display = 'none';
        });
    });
}

// Lancement
document.addEventListener('DOMContentLoaded', initializeApplication);

// Gestion des onglets
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
});
