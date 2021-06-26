'use strict';

class DomMaker {
  constructor() {
    // the rootElement will be the parent of everything (but modals)
    this.rootElement = this.newElement('div', {
      parentElement: document.body,
      class: 'root-element',
    });

    this.cardMountpoint = this.newElement('div', {
      parentElement: this.rootElement,
      class: 'card-mountpoint',
    });
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

    // this flag tracks the state of the children of main element
    this.isEachChildDisabled = false; // the flag changes state, so first it will disable elements, then it will switch

    // they store cards and modals
    this.cardArray = [];

    // generate buttons for options
    this.addButton = this.newElement('button', {
      content: 'new',
      class: 'btn options__add-btn',
      click: this.newCardModal.bind(this),
    });
    this.modifyButton = this.newElement('button', {
      content: 'modify',
      class: 'btn options__modify-btn',
      click: this.modifyModal.bind(this),
    });
    this.settingsButton = this.newElement('button', {
      content: 'settings',
      class: 'btn options__settings-btn',
      click: this.settingsModal.bind(this),
    });

    this.sidePaneTitle = this.newElement('h1', {
      content: 'options',
      class: 'side-pane__title',
    });
    this.options = this.newElement('div', {
      content: [this.addButton, this.modifyButton, this.settingsButton],
      class: 'side-pane__options',
    });

    this.sidePane = this.newElement('div', {
      content: [this.sidePaneTitle, this.options],
      class: 'side-pane',
      parentElement: this.rootElement,
      doPrepend: true, // it needs to be first in the dom
    });
  }

  appendElement(element, parent, options) {
    // if true -> append to the default element (cards)
    if (options.doMount === true) this.cardMountpoint.appendChild(element);
    else if (
      typeof parent === 'object' &&
      typeof parent.appendChild === 'function' &&
      typeof element === 'object' &&
      typeof element.appendChild === 'function'
    )
      if (options.doPrepend === true) parent.prepend(element);
      else parent.appendChild(element);
  }

  newElement(elementType, propertiesObj) {
    if (typeof elementType !== 'string') return false;

    const element = document.createElement(elementType);

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

    if (!propertiesObj) {
      return element; // we're done
    }

    // adding properties
    const keys = Object.keys(propertiesObj); // list of property names

    keys.forEach(key => {
      // accepts only string with exceptions
      const allowedKeys = ['style', 'draggable'];
      if (
        (typeof propertiesObj[key] !== 'string' && !allowedKeys.includes(key)) ||
        key === 'content'
      )
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
  }

  newCard(word, example, definition, options) {
    const id = options.id // if we set an id before (doRerender)
      ? options.id
      : `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const card = this.newElement('button', {
      class: 'card',
      dataId: id,
      draggable: options.draggable,
    });

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
  }

  refreshCards(mountpoint = this.cardMountpoint) {
    // remove items from the mountpoint
    mountpoint.innerHTML = '';

    // add them from the list
    this.cardArray.forEach(item => {
      this.newCard(item.word, item.example, item.definition, {
        doMount: true,
        doRerender: true,
        id: item.id,
      });
    });
  }

  newModal(parent, options) {
    this.toggleDisableAndBlur();

    const title = this.newElement('div', {
      content: [`<h1>${options?.title}</h1>` ?? '', '<hr />'],
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
  }

  generateForm(parentElement, options) {
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
        this.generatePreviewCard('front', {
          word: options?.card?.word,
          example: options?.card?.example,
        }),
        this.generatePreviewCard('back', { definition: options?.card?.definition }),
      ],
      parentElement: formContainer,
    });

    labels.addEventListener('keyup', () => {
      previewCards.innerHTML = '';

      previewCards.append(
        this.generatePreviewCard('front', {
          word: wordInput.value,
          example: exampleInput.value,
        })
      );
      previewCards.append(this.generatePreviewCard('back', { definition: definitionInput.value }));
    });

    const submitButton = this.newElement('button', {
      content: 'submit',
      class: 'modal__btn',
      parentElement: formContainer,
      click: () => {
        options.doMakeNew
          ? this.newCard(wordInput.value, exampleInput.value, definitionInput.value, {
              doMount: true,
            })
          : this.updateCard(
              options.card,
              wordInput.value,
              exampleInput.value,
              definitionInput.value
            );
      },
    });

    return [wordInput, exampleInput, definitionInput];
  }

  newCardModal() {
    const modalContent = this.newModal(document.body, {
      title: 'add a new card',
    });

    this.generateForm(modalContent, {
      doMakeNew: true,
    });
  }

  generateSmallCards() {
    const previewCardArray = [];

    // forEach card make a new one
    this.cardArray.forEach(cardObject => {
      const cardElement = this.newCard(cardObject.word, cardObject.example, cardObject.definition, {
        doMount: false,
        doRerender: true,
        id: cardObject.id,
        draggable: true,
      });

      cardElement.classList.add('card--small');
      cardElement.disabled = false;

      previewCardArray.push(cardElement);

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

    return previewCardArray;
  }

  modifyModal() {
    const modalContent = this.newModal(document.body, {
      title: 'modify a card',
    });
    // create an array of the cards with additional functionalities
    const previewCardArray = this.generateSmallCards();

    // prepend all of those items here - so they are at the top of the modal
    this.previewCardContainer = this.newElement('div', {
      content: previewCardArray,
      class: 'modal__preview-container',
      parentElement: modalContent,
      doPrepend: true,
    });

    // event delegation
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
  }

  settingsModal() {
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
      content: [this.generatePreviewCard('front'), this.generatePreviewCard('back')],
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
  }

  updateCard(card, newWord, newExample, newDefinition) {
    if (!card) return;

    card.word = newWord;
    card.example = newExample;
    card.definition = newDefinition;

    // update UI
    this.refreshCards();

    this.previewCardContainer.innerHTML = '';
    this.generateSmallCards().forEach(card => this.previewCardContainer.append(card));
  }

  toggleDisableAndBlur() {
    const childrenArray = document.querySelectorAll('.root-element *');

    this.isEachChildDisabled = !this.isEachChildDisabled;

    childrenArray.forEach(child => {
      child.disabled = this.isEachChildDisabled; // first it will disable the children then enable and so on
    });

    this.rootElement.classList.toggle('blurred');
  }

  generatePreviewCard(renderSide, options) {
    return this.newCard(
      options?.word ?? 'word',
      options?.example ?? 'example',
      options?.definition ?? 'definition',
      {
        doRerender: true, // force to skip adding to the card array
        renderSide: renderSide,
        parentElement: options?.parentElement,
      }
    );
  }
}

const maker = new DomMaker();

function generateExampleCards(numberOfCards) {
  for (let i = 0; i < numberOfCards; i++) {
    maker.newCard(`word no.${i + 1}`, `example sentence no.${i + 1}`, `definition no.${i + 1}`, {
      doMount: true,
    });
  }
}

generateExampleCards(Math.floor(Math.random() * 5) + 1); // 1 to 5 cards

// TODO
//  modify modal:
//    proper modify card options, switching the order of the cards (dragging?), and such
//    addCardModal too: right side of labels: preview of the card that updates live as you type the options, with a checkbox/button to show the other side
