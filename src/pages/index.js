import "./index.css";
import defaultAvatar from "../images/avatar.jpg";

import {
  enableValidation,
  validationConfig,
  disableSubmitButton,
  resetValidation,
} from "../scripts/validation.js";
import Api from "../scripts/Api.js";

// Form validation setup
const settings = validationConfig;
enableValidation(settings);

// API client setup
const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "ee7f1f89-62b1-411e-b13d-831078c5aca1",
    "Content-Type": "application/json",
  },
});

let currentUserId = null;

// Initial page data load (cards + user profile)
api
  .getAppInfo()
  .then(([cards, userInfo]) => {
    currentUserId = userInfo._id;
    cards.forEach((item) => {
      const cardEl = getCardElement(item);
      cardsList.append(cardEl);
    });
    profileNameEl.textContent = userInfo.name;
    profileDescriptionEl.textContent = userInfo.about;
    setProfileAvatar(userInfo.avatar);
  })
  .catch(console.error);

// Edit profile modal elements
const editProfileBtn = document.querySelector(".profile__edit-btn");
const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileCloseBtn = editProfileModal.querySelector(".modal__close-btn");
const editProfileForm = editProfileModal.querySelector(".modal__form");
const editProfileSubmitBtn = editProfileForm.querySelector(".modal__submit-btn");
const editProfileNameInput = editProfileModal.querySelector(
  "#profile-name-input",
);

const editProfileDescriptionInput = editProfileModal.querySelector(
  "#profile-description-input",
);

// Edit avatar modal elements
const avatarModalBtn = document.querySelector(".profile__avatar-btn");
const editAvatarModal = document.querySelector("#edit-avatar-modal");
const editAvatarCloseBtn = editAvatarModal?.querySelector(".modal__close-btn");
const editAvatarForm = editAvatarModal?.querySelector(".modal__form");
const editAvatarInput = editAvatarModal?.querySelector("#profile-avatar-input");
const avatarSubmitBtn = editAvatarModal?.querySelector(".modal__submit-btn");

// New post modal elements
const newPostBtn = document.querySelector(".profile__add-btn");
const newPostModal = document.querySelector("#new-post-modal");
const newPostCloseBtn = newPostModal.querySelector(".modal__close-btn");

const cardSubmitBtn = newPostModal.querySelector(".modal__submit-btn");

const addCardFormElement = newPostModal.querySelector(".modal__form");
const descriptionInput = newPostModal.querySelector("#card-description-input");
const linkInput = newPostModal.querySelector("#card-image-input");

// Image preview modal elements
const previewModal = document.querySelector("#preview-modal");
const previewModalCloseBtn = previewModal.querySelector(".modal__close-btn");

// Delete form element
const deleteModal = document.querySelector("#delete-modal");
const deleteForm = deleteModal?.querySelector("#delete-form");
const deleteSubmitBtn = deleteForm?.querySelector(".modal__submit-btn");
const deleteModalCloseBtn = deleteModal?.querySelector(".modal__close-btn");
const deleteCancelBtn = deleteModal?.querySelector(".modal__cancel-btn");
let selectedCard = null;
let selectedCardId = null;
const ESCAPE_KEY = "Escape";

// Preview modal close button listener
if (previewModalCloseBtn) {
  previewModalCloseBtn.addEventListener("click", () => {
    closeModal(previewModal);
  });
}

const previewImageEl = previewModal.querySelector(".modal__image");
const previewCaptionEl = previewModal.querySelector(".modal__caption");

// Cards template and list container
const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");
const cardsList = document.querySelector(".cards__list");

function isCardLiked(cardData) {
  if (typeof cardData?.isLiked === "boolean") {
    return cardData.isLiked;
  }

  if (!Array.isArray(cardData?.likes) || !currentUserId) {
    return false;
  }

  return cardData.likes.some((like) => {
    const likeOwnerId = typeof like === "string" ? like : like?._id;
    return likeOwnerId === currentUserId;
  });
}

// Card creation and card-level interactions
function getCardElement(data) {
  let cardData = data;
  const cardElement = cardTemplate.cloneNode(true);
  const cardTitleEl = cardElement.querySelector(".card__title");
  const cardImageEl = cardElement.querySelector(".card__image");

  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;
  cardTitleEl.textContent = data.name;

  const cardLikeBtnEl = cardElement.querySelector(".card__like-btn");
  cardLikeBtnEl.classList.toggle("card__like-button-active", isCardLiked(cardData));
  cardLikeBtnEl.addEventListener("click", () => {
    const isLiked = cardLikeBtnEl.classList.contains("card__like-button-active");

    if (!cardData._id) {
      cardLikeBtnEl.classList.toggle("card__like-button-active");
      return;
    }

    const likeRequest = isLiked
      ? api.removeLike(cardData._id)
      : api.addLike(cardData._id);

    likeRequest
      .then((updatedCard) => {
        cardData = updatedCard;
        cardLikeBtnEl.classList.toggle(
          "card__like-button-active",
          isCardLiked(updatedCard),
        );
      })
      .catch(console.error);
  });

  const cardDeleteBtnEl = cardElement.querySelector(".card__delete-button");
  const ownerId = typeof data.owner === "string" ? data.owner : data.owner?._id;
  const isOwnCard = ownerId === currentUserId;
  if (data.owner && !isOwnCard) {
    cardDeleteBtnEl.remove();
  }

  cardDeleteBtnEl.addEventListener("click", () => {
    selectedCard = cardElement;
    selectedCardId = data._id;
    openModal(deleteModal);
  });

  cardImageEl.addEventListener("click", () => {
    previewImageEl.src = data.link;
    previewImageEl.alt = data.name;
    previewCaptionEl.textContent = data.name;
    openModal(previewModal);
  });

  return cardElement;
}

// Modal utility helpers
function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", handleEscClose);
}

function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  if (!document.querySelector(".modal.modal_is-opened")) {
    document.removeEventListener("keydown", handleEscClose);
  }
}

function handleEscClose(evt) {
  if (evt.key !== ESCAPE_KEY) {
    return;
  }

  const openedModal = document.querySelector(".modal.modal_is-opened");
  if (openedModal) {
    closeModal(openedModal);
  }
}

function resetSelectedCard() {
  selectedCard = null;
  selectedCardId = null;
}

function renderLoading(isLoading, buttonEl, loadingText = "Saving...") {
  if (!buttonEl) {
    return;
  }

  if (!buttonEl.dataset.defaultText) {
    buttonEl.dataset.defaultText = buttonEl.textContent;
  }

  buttonEl.textContent = isLoading ? loadingText : buttonEl.dataset.defaultText;
}

// Shared overlay click listener for all modals
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (evt) => {
    if (evt.target === evt.currentTarget) {
      closeModal(modal);
    }
  });
});

// New card form submit handler
function handleAddCardSubmit(evt) {
  evt.preventDefault();
  renderLoading(true, cardSubmitBtn);

  api
    .addCard({
      name: descriptionInput.value,
      link: linkInput.value,
    })
    .then((cardData) => {
      const cardElement = getCardElement(cardData);
      cardsList.prepend(cardElement);
      addCardFormElement.reset();
      disableSubmitButton(cardSubmitBtn, settings);
      closeModal(newPostModal);
    })
    .catch(console.error)
    .finally(() => {
      renderLoading(false, cardSubmitBtn);
    });
}

// New card form submit binding
addCardFormElement.addEventListener("submit", handleAddCardSubmit);

function handleDeleteCardSubmit(evt) {
  evt.preventDefault();
  if (!selectedCard) {
    return;
  }

  if (!selectedCardId) {
    selectedCard.remove();
    closeModal(deleteModal);
    resetSelectedCard();
    return;
  }

  renderLoading(true, deleteSubmitBtn, "Deleting...");
  api
    .deleteCard(selectedCardId)
    .then(() => {
      selectedCard.remove();
      closeModal(deleteModal);
      resetSelectedCard();
    })
    .catch(console.error)
    .finally(() => {
      renderLoading(false, deleteSubmitBtn, "Deleting...");
    });
}

// Profile display elements on the page
const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");
const profileAvatarEl = document.querySelector(".profile__avatar");
profileAvatarEl.addEventListener("error", () => {
  profileAvatarEl.src = defaultAvatar;
});

function setProfileAvatar(avatarUrl) {
  profileAvatarEl.src = avatarUrl || defaultAvatar;
}

// Modal open/close button listeners
function openEditAvatarModal() {
  if (!editAvatarModal || !editAvatarForm || !editAvatarInput) {
    return;
  }

  resetValidation(editAvatarForm, [editAvatarInput], settings);
  editAvatarInput.value = profileAvatarEl.src;
  openModal(editAvatarModal);
}

editProfileBtn.addEventListener("click", function () {
  resetValidation(
    editProfileForm,
    [editProfileNameInput, editProfileDescriptionInput],
    settings,
  );

  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;
  openModal(editProfileModal);
});

avatarModalBtn.addEventListener("click", openEditAvatarModal);
profileAvatarEl.addEventListener("click", openEditAvatarModal);

editProfileCloseBtn.addEventListener("click", function () {
  closeModal(editProfileModal);
});

if (editAvatarCloseBtn) {
  editAvatarCloseBtn.addEventListener("click", function () {
    closeModal(editAvatarModal);
  });
}

newPostBtn.addEventListener("click", function () {
  resetValidation(addCardFormElement, [descriptionInput, linkInput], settings);
  openModal(newPostModal);
});

newPostCloseBtn.addEventListener("click", function () {
  closeModal(newPostModal);
});

if (deleteModalCloseBtn) {
  deleteModalCloseBtn.addEventListener("click", () => {
    closeModal(deleteModal);
    resetSelectedCard();
  });
}

if (deleteCancelBtn) {
  deleteCancelBtn.addEventListener("click", () => {
    closeModal(deleteModal);
    resetSelectedCard();
  });
}

// Edit profile form submit handler
function handleEditProfileSubmit(evt) {
  evt.preventDefault();
  renderLoading(true, editProfileSubmitBtn);
  api
    .editUserInfo({
      name: editProfileNameInput.value,
      about: editProfileDescriptionInput.value,
    })
    .then((data) => {
      profileNameEl.textContent = data.name;
      profileDescriptionEl.textContent = data.about;
      closeModal(editProfileModal);
    })
    .catch(console.error)
    .finally(() => {
      renderLoading(false, editProfileSubmitBtn);
    });
}

// Edit avatar form submit handler
function handleAvatarSubmit(evt) {
  evt.preventDefault();
  if (!editAvatarInput) {
    return;
  }

  renderLoading(true, avatarSubmitBtn);
  api
    .editAvatarInfo(editAvatarInput.value)
    .then((data) => {
      setProfileAvatar(data.avatar);
      closeModal(editAvatarModal);
    })
    .catch(console.error)
    .finally(() => {
      renderLoading(false, avatarSubmitBtn);
    });
}

// Profile form submit bindings
editProfileForm.addEventListener("submit", handleEditProfileSubmit);
if (editAvatarForm) {
  editAvatarForm.addEventListener("submit", handleAvatarSubmit);
}

if (deleteForm) {
  deleteForm.addEventListener("submit", handleDeleteCardSubmit);
}
