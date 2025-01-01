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
                    <span>${(item.price * item.quantity).toFixed(2)} D.A</span>
                `;
                cartItemsContainer.appendChild(cartItem);
            }
        });
        
        // Mettre à jour le total
        totalPriceElement.textContent = `${cart.total.toFixed(2)} D.A`;
    }

    // Gestion des boutons + et -
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const minusBtn = card.querySelector('.minus');
        const plusBtn = card.querySelector('.plus');
        const quantitySpan = card.querySelector('.quantity');
        const productName = card.querySelector('h3').textContent;
        const productPriceText = card.querySelector('p').textContent;
        const productPrice = parseFloat(productPriceText.replace(/[^0-9.,]+/g, '').replace(',', '.'));
        
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
            attribution: ' OpenStreetMap contributors'
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
        const email = document.getElementById('email').value.trim();
        const phone = phoneInput.value.replace(/\s/g, '');
        let isValid = true;

        // Validation du nom
        if (name.length < 2) {
            document.getElementById('nameError').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('nameError').style.display = 'none';
        }

        // Validation de l'email
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            document.getElementById('emailError').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('emailError').style.display = 'none';
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
                email: email,
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

    // Gestion de la notation
    const ratingModal = document.getElementById('ratingModal');
    const ratingModalCloseBtn = ratingModal.querySelector('.close-modal');
    const stars = ratingModal.querySelectorAll('.star');
    const ratingForm = document.getElementById('ratingForm');
    const commentTextarea = document.getElementById('comment');
    const charCount = document.querySelector('.char-count');
    let selectedRating = 0;

    // Gestion des étoiles
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            highlightStars(rating);
        });

        star.addEventListener('mouseout', () => {
            highlightStars(selectedRating);
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            highlightStars(selectedRating);
        });
    });

    function highlightStars(rating) {
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Compteur de caractères
    commentTextarea.addEventListener('input', () => {
        const currentLength = commentTextarea.value.length;
        charCount.textContent = `${currentLength} / 500`;
        
        if (currentLength > 500) {
            commentTextarea.value = commentTextarea.value.slice(0, 500);
            charCount.textContent = '500 / 500';
        }
    });

    // Validation du formulaire de notation
    function validateRatingForm() {
        if (selectedRating === 0) {
            alert('Veuillez sélectionner une note');
            return false;
        }

        const comment = commentTextarea.value.trim();
        if (comment.length > 500) {
            alert('Le commentaire ne doit pas dépasser 500 caractères');
            return false;
        }

        return true;
    }

    // Soumission du formulaire de notation
    ratingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validation
        if (!validateRatingForm()) {
            return;
        }

        const name = document.getElementById('review-name').value.trim() || 'Anonyme';
        const comment = commentTextarea.value.trim();

        // Stocker l'avis dans localStorage
        const review = {
            name: name,
            rating: selectedRating,
            comment: comment,
            date: new Date().toISOString()
        };

        // Récupérer les avis existants
        let reviews = JSON.parse(localStorage.getItem('restaurantReviews') || '[]');
        reviews.push(review);

        // Limiter à 50 derniers avis
        if (reviews.length > 50) {
            reviews = reviews.slice(-50);
        }

        localStorage.setItem('restaurantReviews', JSON.stringify(reviews));

        // Afficher un message de remerciement personnalisé
        let thankYouMessage = 'Merci pour votre avis !';
        switch (selectedRating) {
            case 5:
                thankYouMessage += ' Nous sommes ravis que vous ayez adoré notre service !';
                break;
            case 4:
                thankYouMessage += ' Merci pour votre retour positif !';
                break;
            case 3:
                thankYouMessage += ' Nous travaillons constamment à améliorer notre service.';
                break;
            case 2:
            case 1:
                thankYouMessage += ' Nous prenons en compte vos remarques pour nous améliorer.';
                break;
        }

        alert(thankYouMessage);
        
        // Réinitialiser le formulaire
        ratingForm.reset();
        selectedRating = 0;
        highlightStars(0);
        charCount.textContent = '0 / 500';
        
        // Fermer le modal
        ratingModal.style.display = 'none';
    });

    // Bouton pour ouvrir le modal de notation
    const openRatingModalBtn = document.createElement('button');
    openRatingModalBtn.textContent = 'Donner un avis';
    openRatingModalBtn.classList.add('rating-btn');
    openRatingModalBtn.addEventListener('click', () => {
        ratingModal.style.display = 'block';
    });
    
    const footer = document.querySelector('footer');
    if (footer) {
        footer.appendChild(openRatingModalBtn);
    }

    // Fermer le modal de notation
    ratingModalCloseBtn.addEventListener('click', () => {
        ratingModal.style.display = 'none';
    });

    // Calculer la note moyenne
    function calculateAverageRating(reviews) {
        if (reviews.length === 0) return 0;
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return totalRating / reviews.length;
    }

    // Afficher les statistiques des avis (gardé pour le développement)
    function displayReviewStats() {
        const reviews = JSON.parse(localStorage.getItem('restaurantReviews') || '[]');
        const averageRating = calculateAverageRating(reviews);
        const totalReviews = reviews.length;

        console.log(`Statistiques des avis :`);
        console.log(`Nombre total d'avis : ${totalReviews}`);
        console.log(`Note moyenne : ${averageRating.toFixed(1)} / 5`);
    }

    // Appeler cette fonction pour voir les statistiques
    displayReviewStats();

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
