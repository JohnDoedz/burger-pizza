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

    // Gestion des produits et du panier
    const cart = {
        items: [],
        total: 0
    };

    function updateCartDisplay() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const totalPriceElement = document.getElementById('total-price');
        
        if (!cartItemsContainer || !totalPriceElement) {
            console.error('Éléments du panier non trouvés');
            return;
        }

        // Vider le contenu actuel du panier
        cartItemsContainer.innerHTML = '';
        
        // Ajouter chaque article du panier
        cart.items.forEach(item => {
            if (item.quantity > 0) {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.innerHTML = `
                    <span>${item.name}</span>
                    <span>Qté: ${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} D.A</span>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            }
        });

        // Mettre à jour le prix total
        totalPriceElement.textContent = `${cart.total.toFixed(2)} D.A`;

        // Sauvegarder le panier dans localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCart(productName, productPrice, quantity) {
        // Trouver l'index de l'article existant
        const existingItemIndex = cart.items.findIndex(item => item.name === productName);
        
        if (existingItemIndex !== -1) {
            // Mettre à jour l'article existant
            cart.items[existingItemIndex].quantity = quantity;
            
            // Recalculer le total
            cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        } else {
            // Ajouter un nouvel article si la quantité est > 0
            if (quantity > 0) {
                cart.items.push({
                    name: productName,
                    price: productPrice,
                    quantity: quantity
                });
                cart.total += productPrice * quantity;
            }
        }
        
        updateCartDisplay();
    }

    // Restaurer le panier depuis localStorage si existant
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        cart.items = parsedCart.items;
        cart.total = parsedCart.total;
        updateCartDisplay();
    }

    // Sélectionner tous les produits
    const productCards = document.querySelectorAll('.product-card');
    console.log(`🔢 Nombre de cartes de produits trouvées : ${productCards.length}`);
    
    productCards.forEach((card, index) => {
        const minusBtn = card.querySelector('.minus');
        const plusBtn = card.querySelector('.plus');
        const quantitySpan = card.querySelector('.quantity');
        const productName = card.querySelector('h3').textContent;
        const productPriceText = card.querySelector('p').textContent;
        const productPrice = parseFloat(productPriceText.replace(/[^0-9.,]+/g, '').replace(',', '.'));
        
        console.log(`🍔 Produit #${index + 1}: ${productName}, Prix : ${productPrice}`);
        
        let quantity = 0;
        
        if (!minusBtn || !plusBtn || !quantitySpan) {
            console.error(`❌ Éléments manquants pour ${productName}:`, {
                minusBtn: !!minusBtn,
                plusBtn: !!plusBtn,
                quantitySpan: !!quantitySpan
            });
            return;
        }
        
        console.log(`🔘 Configuration des boutons pour ${productName}`, {
            minusBtnExists: !!minusBtn,
            plusBtnExists: !!plusBtn,
            quantitySpanExists: !!quantitySpan
        });

        plusBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            console.log(`➕ Bouton + cliqué pour ${productName}`);
            quantity++;
            quantitySpan.textContent = quantity;
            updateCart(productName, productPrice, quantity);
        });
        
        minusBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            console.log(`➖ Bouton - cliqué pour ${productName}`);
            if (quantity > 0) {
                quantity--;
                quantitySpan.textContent = quantity;
                updateCart(productName, productPrice, quantity);
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    const ratingModal = document.getElementById('ratingModal');

    if (orderForm) {
        orderForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Récupérer les données du formulaire
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value.replace(/\s/g, '');
            const orderDetails = document.getElementById('order-details').value || 'Aucune instruction spéciale';

            // Simuler l'envoi de la commande (à remplacer par un vrai backend)
            console.log('Commande envoyée:', { name, email, phone, orderDetails });

            // Fermer le modal de commande
            const orderModal = document.getElementById('orderModal');
            if (orderModal) {
                orderModal.style.display = 'none';
            }

            // Vider complètement le panier
            cart.items = [];
            cart.total = 0;
            localStorage.removeItem('cart');
            updateCartDisplay();

            // Réinitialiser les quantités sur l'interface
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                const quantitySpan = card.querySelector('.quantity');
                const minusBtn = card.querySelector('.minus');
                const plusBtn = card.querySelector('.plus');
                
                if (quantitySpan) {
                    quantitySpan.textContent = '0';
                }
                
                // Réinitialiser la variable locale de quantité
                let quantity = 0;
            });

            // Afficher le modal de notation
            if (ratingModal) {
                ratingModal.style.display = 'block';
            }

            // Réinitialiser le formulaire
            orderForm.reset();
        });
    }

    // Gestion de la notation
    const ratingForm = document.getElementById('ratingForm');
    const stars = document.querySelectorAll('.star');
    let selectedRating = 0;

    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            
            // Mettre à jour le style des étoiles
            stars.forEach(s => {
                const rating = parseInt(s.getAttribute('data-rating'));
                s.classList.toggle('selected', rating <= selectedRating);
            });
        });
    });

    if (ratingForm) {
        ratingForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const reviewName = document.getElementById('review-name').value;
            const comment = document.getElementById('comment').value;

            console.log('Avis soumis:', {
                rating: selectedRating,
                name: reviewName,
                comment: comment
            });

            // Fermer le modal de notation
            ratingModal.style.display = 'none';

            // Réinitialiser le formulaire
            ratingForm.reset();
            stars.forEach(s => s.classList.remove('selected'));
        });
    }

    // Fermeture des modaux
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Supprimer tous les caractères non numériques
            let phoneNumber = this.value.replace(/\D/g, '');
            
            // Limiter à 10 chiffres
            phoneNumber = phoneNumber.slice(0, 10);
            
            // Formater avec des espaces tous les 2 chiffres
            if (phoneNumber.length > 0) {
                let formatted = '';
                for (let i = 0; i < phoneNumber.length; i += 2) {
                    formatted += phoneNumber.slice(i, i + 2) + (i + 2 < phoneNumber.length ? ' ' : '');
                }
                this.value = formatted.trim();
            }
        });
    }
});
