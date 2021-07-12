'use strict';

const DomMaker = function (rootElement, cardArray) {
  // the rootElement will be the parent of everything (but modals)
  this.rootElement = rootElement;

  this.cardArray = cardArray;

  // this flag tracks the state of the children of main element
  this.isEachChildDisabled = false; // the flag changes state, so first it will disable elements, then it will switch

  if (this.constructor === DomMaker) this.generateDom();
};

// to DomMaker
DomMaker.prototype.newElement = function (elementType, propertiesObj) {
  if (typeof elementType !== 'string') return false;

  const element = document.createElement(elementType);

  if (!propertiesObj) {
    return element; // we're done
  }

  // append content
  if (propertiesObj?.content)
    // IIFE recursive function lol
    (function recursiveCheckAssignContent(content, layer = 0, maxLayer = 3) {
      if (layer >= maxLayer || !content) return;

      if (typeof content === 'string')
        // valid argument for innerHTML. += so it doesn't delete anything added previously
        element.innerHTML += content;
      else if (typeof content === 'object' && typeof content.appendChild === 'function')
        // valid DOM node inside
        element.appendChild(content);
      else if (typeof content === 'object') {
        // array is an object too, this case works for them both

        const keys = Object.keys(content);

        // run the function for each key
        keys.forEach(key => recursiveCheckAssignContent(content[key], layer + 1)); // check inside the object (array)
      }
    })(propertiesObj.content, 0, 3);

  // adding properties
  const keys = Object.keys(propertiesObj); // list of property names

  keys.forEach(key => {
    // accepts only string with exceptions
    const allowedKeys = ['style', 'draggable'];
    if ((typeof propertiesObj[key] !== 'string' && !allowedKeys.includes(key)) || key === 'content')
      return; // same as 'continue' in a for loop

    // check to assign styles
    if (key === 'style') {
      const styleKeys = Object.keys(propertiesObj.style);

      styleKeys.map(styleProperty => {
        element.style[styleProperty] = propertiesObj.style[styleProperty];
      });
    } else
      element.setAttribute(
        key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()),
        propertiesObj[key]
      ); // parse to give attributes converted to kebab-case (dataId -> data-id)
  });

  // specified a parent -> append
  if (propertiesObj.hasOwnProperty('parentElement'))
    this.appendElement(
      element,
      propertiesObj.parentElement,
      { doPrepend: propertiesObj.doPrepend } // ignore if not set, if set to true it will be inserted as the first child of its parent
    );

  // specified an event listener -> add it
  if (propertiesObj.hasOwnProperty('click'))
    element.addEventListener('click', propertiesObj['click']);

  return element;
};

DomMaker.prototype.appendElement = function (element, parent, options) {
  // if true -> append to the default element (cards)
  if (options.doMount === true) {
    // find the cardMountpoint. Skip the search if property set
    this.cardMountpoint = this.cardMountpoint ?? this.rootElement.querySelector('.card-mountpoint');

    this.cardMountpoint.appendChild(element);
  } else if (
    typeof parent === 'object' &&
    typeof parent.appendChild === 'function' &&
    typeof element === 'object' &&
    typeof element.appendChild === 'function'
  )
    if (options.doPrepend === true) parent.prepend(element);
    else parent.appendChild(element);
};

DomMaker.prototype.generateDom = function () {
  // generateSidePane
  (() => {
    const sidePaneRoot = this.newElement('div', {
      parentElement: this.rootElement,
      class: 'side-pane',
      doPrepend: true, // it needs to be first in the dom
    });

    const title = this.newElement('h1', {
      parentElement: sidePaneRoot,
      content: 'options',
      class: 'side-pane__title',
    });

    const options = this.newElement('div', {
      parentElement: sidePaneRoot,
      class: 'side-pane__options',
    });

    const addButton = this.newElement('button', {
      content: 'new',
      class: 'btn options__add-btn',
      parentElement: options,
    });
    const modifyBtn = this.newElement('button', {
      content: 'modify',
      class: 'btn options__modify-btn',
      parentElement: options,
    });
    const settingsBtn = this.newElement('button', {
      content: 'settings',
      class: 'btn options__settings-btn',
      parentElement: options,
    });
  })();

  const cardMountpoint = this.newElement('div', {
    parentElement: this.rootElement,
    class: 'card-mountpoint',
  });
};

const CardMaker = function (rootElement, cardArray, options) {
  DomMaker.call(this, rootElement, cardArray);

  this.cardMountpoint = document.querySelector('.card-mountpoint');

  if (!options?.isFirstInstance) return this; // new keyword returns this by default, simulate that

  this.cardMountpoint.addEventListener('click', e => {
    const cardElement = e.target.closest('.card');

    if (!cardElement) return; // no card was clicked

    const cardObject = this.cardArray.find(card => card.id === cardElement?.dataset.id);

    if (!cardObject.isFlipped) {
      cardElement.innerHTML = '';

      const definition = this.newElement('p', {
        content: cardObject.definition,
      });

      cardElement.appendChild(definition);
    } else {
      cardElement.innerHTML = '';

      const wordElement = this.newElement('h1', {
        content: cardObject.word,
        class: 'card__title',
      });
      const exampleElement = this.newElement('p', {
        content: cardObject.example,
        class: 'card__example',
      });

      cardElement.appendChild(wordElement);
      cardElement.appendChild(exampleElement);
    }

    cardObject.isFlipped = !cardObject.isFlipped;
  });
};
CardMaker.prototype = Object.create(DomMaker.prototype);
CardMaker.prototype.constructor = CardMaker;

CardMaker.prototype.newCard = function (word, example, definition, options = {}) {
  const id = options.id // if we set an id before (doRerender)
    ? options.id
    : `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const cardOptions = {
    class: 'card',
    dataId: id,
  };
  if (options.draggable) cardOptions.draggable = options.draggable; // set a card property if passed through the arguments' options

  const card = this.newElement('button', cardOptions);

  // if render side not set
  if (options.renderSide === 'back') {
    const definitionElement = this.newElement('p', {
      content: definition,
      class: 'card__definition',
      parentElement: card,
    });

    card.classList.add('card--back');
  } else {
    const wordElement = this.newElement('h1', {
      content: word,
      class: 'card__title',
      parentElement: card,
    });

    const exampleElement = this.newElement('p', {
      content: example,
      class: 'card__example',
      parentElement: card,
    });
  }

  if (options.doMount || options.parentElement)
    this.appendElement(card, options.parentElement, { doMount: options.doMount });

  // initial card property
  const isFlipped = false;

  if (!options.doRerender)
    // the card is loaded for the first time
    this.cardArray.push({
      id,
      word,
      example,
      definition,
      isFlipped,
    });

  // state of the card should match the others
  card.disabled = this.isEachChildDisabled;

  return card;
};

CardMaker.prototype.generateSmallCards = function () {
  const previewCardArray = [];

  // forEach card make a new one, but small
  this.cardArray.forEach(cardObject => {
    const cardElement = this.newCard(cardObject.word, cardObject.example, cardObject.definition, {
      doMount: false,
      doRerender: true,
      id: cardObject.id,
      draggable: true,
    });

    // container that has no margin and will listen for events
    const transparentOuterLayer = this.newElement('div', {
      content: cardElement,
      class: 'card-preview',
    });

    cardElement.classList.add('card--small');
    cardElement.disabled = false;

    previewCardArray.push(transparentOuterLayer);

    const removeCardButton = this.newElement('button', {
      class: 'card--small__btn-delete',
      parentElement: cardElement,
      click: () => {
        // remove from cardArray
        this.cardArray.includes(cardObject)
          ? this.cardArray.splice(this.cardArray.indexOf(cardObject), 1)
          : '';

        // if there are labels shown, remove them from the DOM
        cardElement.closest('.modal__content').querySelector('.form-container')?.remove();

        // remove preview card
        cardElement.remove();

        this.refreshCards(this.cardMountpoint);
      },
    });
  });

  previewCardArray.forEach(previewItem => {
    const card = previewItem.querySelector('.card');

    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
      previewCardArray.forEach(el =>
        el.querySelector('.card--small__btn-delete')?.classList.add('hidden')
      );
    });

    card.addEventListener('dragend', e => {
      const nextElement = e.target.closest('.card-preview').nextElementSibling; // get the next sibling card preview div

      card.classList.remove('dragging');
      previewCardArray.forEach(el =>
        el.querySelector('.card--small__btn-delete')?.classList.remove('hidden')
      );

      const arrayDragged = this.cardArray.find(item => item.id === card.dataset.id);

      if (!nextElement) {
        // move the item to the end of the array
        this.cardArray.splice(this.cardArray.indexOf(arrayDragged), 1);
        this.cardArray.push(arrayDragged);

        return;
      }

      // there is a next element
      const arrayNext = this.cardArray.find(
        item => item.id === nextElement.querySelector('.card').dataset.id
      );

      // no change
      if (arrayDragged === this.cardArray[this.cardArray.indexOf(arrayNext) - 1]) return;

      // change the card array
      this.cardArray.splice(this.cardArray.indexOf(arrayDragged), 1); // remove the dragged item
      this.cardArray.splice(this.cardArray.indexOf(arrayNext), 0, arrayDragged); // insert the dragged item before arrayNext

      // remount the main card container's cards
      this.refreshCards();
    });
  });

  return previewCardArray;
};

CardMaker.prototype.refreshCards = function (mountpoint) {
  // remove items from the mountpoint

  if (!mountpoint) mountpoint = this.rootElement.querySelector('.card-mountpoint');

  mountpoint.innerHTML = '';

  // add them from the list
  this.cardArray.forEach(item => {
    this.newCard(item.word, item.example, item.definition, {
      doMount: true,
      doRerender: true,
      id: item.id,
    });
  });
};

CardMaker.prototype.updateCard = function (card, newWord, newExample, newDefinition) {
  if (!card) return;

  card.word = newWord;
  card.example = newExample;
  card.definition = newDefinition;

  // remount the main card container
  this.refreshCards();

  // remount the preview (small) cards
  const previewCardContainer = document.querySelector('.modal__preview-container');

  previewCardContainer.innerHTML = '';
  this.generateSmallCards().forEach(card => previewCardContainer.append(card));
};

const ModalMaker = function (rootElement, cardArray, options) {
  DomMaker.call(this, rootElement, cardArray);

  // create eventListeners for buttons
  const addBtn = rootElement.querySelector('.btn.options__add-btn');
  addBtn.addEventListener('click', this.newCardModal.bind(this));

  const modifyBtn = rootElement.querySelector('.btn.options__modify-btn');
  modifyBtn.addEventListener('click', this.modifyModal.bind(this));

  const settingsBtn = rootElement.querySelector('.btn.options__settings-btn');
  settingsBtn.addEventListener('click', this.settingsModal.bind(this));

  if (!options?.isFirstInstance) return this;

  // working on the first instance only
  this.auxiliaryCardMaker = new CardMaker(rootElement, cardArray); // periodically used by modals
};
ModalMaker.prototype = Object.create(DomMaker.prototype);
ModalMaker.prototype.constructor = ModalMaker;

ModalMaker.prototype.newModal = function (parent, options) {
  this.toggleDisableAndBlur(this.rootElement);

  const title = this.newElement('div', {
    content: [`<h1>${options?.title ?? 'Modal Title'}</h1>`, '<hr />'],
    class: 'modal__title',
  });

  // the element to which things are appended, the outside layer is for the cancel button and the modal title
  const modalContent = this.newElement('div', {
    class: 'modal__content',
  });

  const exitButton = this.newElement('button', {
    content: 'exit',
    class: 'modal__btn',
    click: () => {
      this.toggleDisableAndBlur();
      modal.remove();
    },
  });

  const modal = this.newElement('div', {
    content: [title, modalContent, exitButton],
    class: 'modal',
  });
  this.appendElement(modal, parent, { doMount: options?.doMount });

  return modalContent;
};

ModalMaker.prototype.toggleDisableAndBlur = function () {
  const childrenArray = this.rootElement.querySelectorAll('*');

  this.isEachChildDisabled = !this.isEachChildDisabled;

  childrenArray.forEach(child => {
    child.disabled = this.isEachChildDisabled; // first it will disable the children then enable and so on
  });

  this.rootElement.classList.toggle('blurred');
};

ModalMaker.prototype.generateForm = function (parentElement, options) {
  const cardMaker = new CardMaker(this.rootElement, this.cardArray); // this function uses the CardMaker object to generate preview

  const createLabel = labelText => {
    const textField = this.newElement('input', {
      type: 'text',
      class: 'modal__label__input',
    });

    const labelTextElement = this.newElement('span', {
      content: labelText,
      class: 'modal__label__text',
    });

    const labelElement = [
      this.newElement('label', {
        content: [labelTextElement, textField],
        class: 'modal__label',
      }),
    ];

    return [labelElement, textField];
  };

  const [wordLabel, wordInput] = createLabel('word:');
  const [exampleLabel, exampleInput] = createLabel('example:');
  const [definitionLabel, definitionInput] = createLabel('definition:');

  const formContainer = this.newElement('div', {
    class: 'form-container',
    parentElement,
  });

  const labels = this.newElement('div', {
    class: 'form-container__labels',
    content: [wordLabel, exampleLabel, definitionLabel],
    parentElement: formContainer,
  });
  const previewCards = this.newElement('div', {
    class: 'form-container__preview-cards',
    content: [
      this.generatePreviewCard({
        word: options?.card?.word,
        example: options?.card?.example,
        renderSide: 'front',
      }),
      this.generatePreviewCard({ definition: options?.card?.definition, renderSide: 'back' }),
    ],
    parentElement: formContainer,
  });

  labels.addEventListener('keyup', () => {
    previewCards.innerHTML = '';

    previewCards.append(
      this.generatePreviewCard({
        word: wordInput.value,
        example: exampleInput.value,
        renderSide: 'front',
      })
    );
    previewCards.append(
      this.generatePreviewCard({ definition: definitionInput.value, renderSide: 'back' })
    );
  });

  const submitButton = this.newElement('button', {
    content: 'submit',
    class: 'modal__btn',
    parentElement: formContainer,
    click: () => {
      options.doMakeNew
        ? cardMaker.newCard(wordInput.value, exampleInput.value, definitionInput.value, {
            doMount: true,
          })
        : cardMaker.updateCard(
            options.card,
            wordInput.value,
            exampleInput.value,
            definitionInput.value
          );
    },
  });

  return [wordInput, exampleInput, definitionInput];
};

ModalMaker.prototype.newCardModal = function () {
  const modalContent = this.newModal(document.body, {
    title: 'add a new card',
  });

  this.generateForm(modalContent, {
    doMakeNew: true,
  });
};

ModalMaker.prototype.modifyModal = function () {
  const cardMaker = new CardMaker(this.rootElement, this.cardArray); // this function uses it to generate preview

  const modalContent = this.newModal(document.body, {
    title: 'modify a card',
  });
  // create an array of the cards with additional functionalities
  const previewCardArray = cardMaker.generateSmallCards();

  // prepend all of those items here - so they are at the top of the modal
  this.previewCardContainer = this.newElement('div', {
    content: previewCardArray,
    class: 'modal__preview-container',
    parentElement: modalContent,
    doPrepend: true,
  });

  this.previewCardContainer.addEventListener('dragover', e => {
    const draggingElement = document.querySelector('.dragging').closest('.card-preview');
    const nextElement = e.target.closest('.card-preview')?.nextElementSibling;

    if (draggingElement === nextElement) {
      this.previewCardContainer.insertBefore(draggingElement, nextElement.previousElementSibling);
      return;
    }

    if (!nextElement) this.previewCardContainer.appendChild(draggingElement);

    this.previewCardContainer.insertBefore(draggingElement, nextElement);
  });

  // show the form, event delegation
  this.previewCardContainer.addEventListener('click', event => {
    if (event.target.classList.contains('card--small__btn-delete')) return;

    modalContent.querySelectorAll('.form-container').forEach(elem => elem.remove());

    // get the IDs from the DOM, then get the object from this.cardArray
    const clicked = event.target.closest('.card');
    const cardObject = this.cardArray.find(card => card.id === clicked?.dataset.id);

    if (clicked) {
      const [wordInput, exampleInput, definitionInput] = this.generateForm(modalContent, {
        card: cardObject,
      });

      wordInput.value = cardObject.word;
      exampleInput.value = cardObject.example;
      definitionInput.value = cardObject.definition;
    }
  });
};

ModalMaker.prototype.settingsModal = function () {
  const cardMaker = new CardMaker(this.rootElement, this.cardArray);

  const modalContent = this.newModal(document.body, {
    title: 'settings',
  });

  const colorSchemesContainer = this.newElement('div', {
    class: 'color-schemes',
    parentElement: modalContent,
  });

  const generateColorSchemeLabel = (color1, color2) => {
    const labelElement = this.newElement('label', {
      class: 'color-label',
      parentElement: colorSchemesContainer,
    });

    const primaryColor = this.newElement('div', {
      class: 'color-label__color-tile',
      dataColor: color1,
      content: 'fg',
      parentElement: labelElement,
      style: {
        backgroundColor: color1,
        color: color2, // so there's always contrast
      },
    });

    const secondaryColor = this.newElement('div', {
      class: 'color-label__color-tile',
      dataColor: color2,
      content: 'bg',
      parentElement: labelElement,
      style: {
        backgroundColor: color2,
        color: color1,
      },
    });

    return labelElement;
  };

  const labelContainer = this.newElement('div', {
    class: 'label-container',
    parentElement: colorSchemesContainer,
  });

  const defaultColorScheme = ['#161616', '#d8d8d8'];
  if (!this.colorSchemes) {
    this.colorSchemes = [
      defaultColorScheme,
      ['#d8d8d8', '#161616'],
      ['#1438d8', '#d8d8d8'],
      ['#d84d07', '#d8d8d8'],
    ];
  }

  this.colorSchemes.forEach(colorScheme => {
    const label = generateColorSchemeLabel(colorScheme[0], colorScheme[1]);
    labelContainer.append(label);

    // default colour scheme
    if (JSON.stringify(colorScheme) === JSON.stringify(defaultColorScheme))
      label.classList.add('color-label--active');
  });

  const exampleCards = this.newElement('div', {
    class: 'preview-cards',
    content: [
      this.generatePreviewCard({ renderSide: 'front' }),
      this.generatePreviewCard({ renderSide: 'back' }),
    ],
    parentElement: colorSchemesContainer,
  });

  labelContainer.addEventListener('click', e => {
    const colorLabel = e.target.closest('.color-label');

    if (!colorLabel) return; // button not found

    const [primaryColorElement, secondaryColorElement] = colorLabel.querySelectorAll(
      '.color-label__color-tile'
    );

    document.documentElement.style.setProperty(
      '--cardForegroundColor',
      primaryColorElement.dataset.color
    );
    document.documentElement.style.setProperty(
      '--cardBackgroundColor',
      secondaryColorElement.dataset.color
    );

    [...colorLabel.parentElement.children].forEach(child =>
      child.classList.remove('color-label--active')
    );
    colorLabel.classList.add('color-label--active');
  });
};

ModalMaker.prototype.generatePreviewCard = function (options) {
  return this.auxiliaryCardMaker.newCard(
    options?.word ?? 'word',
    options?.example ?? 'example',
    options?.definition ?? 'definition',
    {
      doRerender: true, // force to skip adding to the card array
      renderSide: options.renderSide,
      parentElement: options?.parentElement,
    }
  );
};

const root = document.querySelector('.root-element');
const cardArray = [];

const domMaker = new DomMaker(root, cardArray);
const cardMaker = new CardMaker(root, cardArray, { isFirstInstance: true });
const modalMaker = new ModalMaker(root, cardArray, { isFirstInstance: true });

function generateCards(num) {
  for (let i = 0; i < num; i++)
    cardMaker.newCard(`word${i}`, 'example', 'definition', { doMount: true });
}

generateCards(7);
