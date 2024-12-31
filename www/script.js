document.addEventListener('DOMContentLoaded', () => {
    // Gestion des onglets
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons et contenus
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Ajouter la classe active au bouton cliqué et au contenu correspondant
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Gestion du panier
    const cart = {
        items: [],
        total: 0
    };

    // Fonction pour mettre à jour l'affichage du panier
    function updateCartDisplay() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const totalPriceElement = document.getElementById('total-price');
        
        // Vider le contenu actuel du panier
        cartItemsContainer.innerHTML = '';
        
        // Ajouter chaque article du panier
        cart.items.forEach(item => {
            if (item.quantity > 0) {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <span>${item.name} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} €</span>
                `;
                cartItemsContainer.appendChild(cartItem);
            }
        });
        
        // Mettre à jour le total
        totalPriceElement.textContent = `${cart.total.toFixed(2)} €`;
    }

    // Gestion des boutons + et -
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const minusBtn = card.querySelector('.minus');
        const plusBtn = card.querySelector('.plus');
        const quantitySpan = card.querySelector('.quantity');
        const productName = card.querySelector('h3').textContent;
        const productPrice = parseFloat(card.querySelector('p').textContent);
        
        let quantity = 0;
        
        plusBtn.addEventListener('click', () => {
            quantity++;
            quantitySpan.textContent = quantity;
            
            // Mettre à jour le panier
            updateCart(productName, productPrice, quantity);
        });
        
        minusBtn.addEventListener('click', () => {
            if (quantity > 0) {
                quantity--;
                quantitySpan.textContent = quantity;
                
                // Mettre à jour le panier
                updateCart(productName, productPrice, quantity);
            }
        });
    });

    // Fonction pour mettre à jour le panier
    function updateCart(productName, productPrice, quantity) {
        let item = cart.items.find(item => item.name === productName);
        
        if (item) {
            // Mettre à jour la quantité si l'article existe déjà
            cart.total -= item.price * item.quantity;
            item.quantity = quantity;
            cart.total += item.price * item.quantity;
        } else {
            // Ajouter un nouvel article
            cart.items.push({
                name: productName,
                price: productPrice,
                quantity: quantity
            });
            cart.total += productPrice * quantity;
        }
        
        updateCartDisplay();
    }

    // Gestion du modal
    const modal = document.getElementById('orderModal');
    const orderBtn = document.querySelector('.order-btn');
    const closeModal = document.querySelector('.close-modal');
    const orderForm = document.getElementById('orderForm');
    const phoneInput = document.getElementById('phone');

    // Variables pour la carte
    let deliveryMap = null;
    let marker = null;

    // Fonction d'initialisation de la carte
    function initMap() {
        // Coordonnées par défaut (Paris - à adapter selon votre ville)
        const defaultLocation = [48.8566, 2.3522];
        
        deliveryMap = L.map('delivery-map').setView(defaultLocation, 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(deliveryMap);

        // Ajouter un marqueur lors du clic
        deliveryMap.on('click', function(e) {
            if (marker) {
                deliveryMap.removeLayer(marker);
            }
            marker = L.marker(e.latlng).addTo(deliveryMap);
            updateDeliveryLocation(e.latlng);
        });

        // Gérer la géolocalisation
        deliveryMap.on('locationfound', function(e) {
            if (marker) {
                deliveryMap.removeLayer(marker);
            }
            marker = L.marker(e.latlng).addTo(deliveryMap);
            updateDeliveryLocation(e.latlng);
        });

        deliveryMap.on('locationerror', function(e) {
            alert("Impossible d'accéder à votre position. Veuillez l'autoriser dans votre navigateur ou sélectionner manuellement votre position sur la carte.");
        });
    }

    // Mettre à jour les informations de livraison
    function updateDeliveryLocation(latlng) {
        // Ici on pourrait ajouter la logique pour récupérer l'adresse via l'API OpenStreetMap
        console.log('Position sélectionnée:', latlng);
    }

    // Ouvrir le modal
    orderBtn.addEventListener('click', function() {
        if (cart.items.length > 0 && cart.total > 0) {
            modal.style.display = 'block';
            // Petit délai pour s'assurer que le modal est visible
            setTimeout(() => {
                if (!deliveryMap) {
                    initMap();
                }
                // Mettre à jour la taille de la carte
                if (deliveryMap) {
                    deliveryMap.invalidateSize();
                }
            }, 100);
        } else {
            alert('Votre panier est vide !');
        }
    });

    // Fermer le modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Formater le numéro de téléphone
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Garder uniquement les chiffres
        if (value.length > 0) {
            value = value.match(new RegExp('.{1,2}', 'g')).join(' ');
        }
        e.target.value = value;
    });

    // Validation du formulaire
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const phone = phoneInput.value.replace(/\s/g, '');
        let isValid = true;

        // Validation du nom
        if (name.length < 2) {
            document.getElementById('nameError').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('nameError').style.display = 'none';
        }

        // Validation du numéro de téléphone
        if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            document.getElementById('phoneError').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('phoneError').style.display = 'none';
        }

        if (isValid) {
            // Traitement de la commande
            const orderDetails = {
                name: name,
                phone: phone,
                items: cart.items,
                total: cart.total
            };
            
            console.log('Commande validée:', orderDetails);
            alert('Commande validée ! Nous vous contacterons bientôt.');
            
            // Réinitialiser le formulaire et fermer le modal
            orderForm.reset();
            modal.style.display = 'none';
            
            // Réinitialiser le panier
            cart.items = [];
            cart.total = 0;
            document.querySelectorAll('.quantity').forEach(span => span.textContent = '0');
            updateCartDisplay();
        }
    });

    // Ajouter l'événement pour le bouton de géolocalisation une fois que le DOM est chargé
    document.addEventListener('DOMContentLoaded', function() {
        const locateBtn = document.getElementById('locate-me');
        if (locateBtn) {
            locateBtn.addEventListener('click', function() {
                if (deliveryMap) {
                    deliveryMap.locate({setView: true, maxZoom: 16});
                }
            });
        }
    });

    // Fonction pour rechercher une adresse
    async function searchAddress(query) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'adresse:', error);
            return [];
        }
    }

    // Ajouter la gestion de la recherche d'adresse
    const addressInput = document.getElementById('address-search');
    const searchAddressBtn = document.getElementById('search-address-btn');

    searchAddressBtn.addEventListener('click', async function() {
        const query = addressInput.value;
        if (query.length > 0) {
            const results = await searchAddress(query);
            if (results.length > 0) {
                const location = results[0]; // Prendre le premier résultat
                const latlng = {
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lon)
                };
                
                // Centrer la carte et placer le marqueur
                deliveryMap.setView([latlng.lat, latlng.lng], 16);
                if (marker) {
                    deliveryMap.removeLayer(marker);
                }
                marker = L.marker([latlng.lat, latlng.lng]).addTo(deliveryMap);
            } else {
                alert('Adresse non trouvée. Veuillez réessayer.');
            }
        } else {
            alert('Veuillez entrer une adresse.');
        }
    });

    // Permettre la recherche en appuyant sur Entrée
    addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Empêcher la soumission du formulaire
            searchAddressBtn.click();
        }
    });

    // Enregistrement du service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful');
                })
                .catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
});
