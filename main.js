import categoriesData from "./data/words.json" with { type: "json" };
// Selectors
// Start Screen
const startScreen = document.querySelector(".start-screen");
const categoryListElement = document.querySelector(".category-list");
const startButton = document.querySelector(".start-game");
// game-section
const gameSection = document.querySelector(".game-section");
const categoryNameElement = document.querySelector(".category dd");
const currentAttemptsElement = document.querySelector(".current-attempts");
const maxAttemptsElement = document.querySelector(".max-attempts");
const lettersContainer = document.querySelector(".letters");
const lettersGuessContainer = document.querySelector(".letters-guess");
const drawElements = Array.from(
  document.querySelectorAll(".hangman-draw .part"),
);
// result-modal
const resultModal = document.querySelector(".result-modal");
const resultModalAgainBtn = document.querySelector(".result-modal__again-btn");
const resultModalHomeBtn = document.querySelector(".result-modal__home-btn");
const hintDialog = document.querySelector(".dialog_hint");
// logical vars
const sounds = {
  success: new Audio("sounds/success.mp3"),
  fail: new Audio("sounds/wrong.mp3"),
};
const gameState = {
  category: "",
  word: "",
  normalizeWord: "",
  wordArr: [],
  description: "",
  wrongAttempts: 0,
  maxAttempts: drawElements.length,
  revealedLettersCount: 0,
};
const letterBoxMap = new Map();
startButton.addEventListener("click", () => {
  const checkedInput = categoryListElement.querySelector(
    `input[name="category"]:checked`,
  );
  if (!checkedInput) {
    console.error("There Is No checked Category");
    return;
  }
  let chosenCategory = checkedInput.value;
  if (chosenCategory === "random") {
    chosenCategory = getRandomItem(Object.keys(categoriesData));
  }
  startGame(chosenCategory);
});
lettersContainer.addEventListener("click", (e) => {
  if (
    !e.target.classList.contains("letter-box") ||
    e.target.classList.contains("clicked")
  )
    return;
  e.target.classList.add("clicked");
  handleGuess(e.target.textContent);
});
window.addEventListener("keydown", (e) => {
  const englishLetters = "abcdefghijklmnopqrstuvwxyz";
  if (startScreen.hidden === false && e.key === "Enter") {
    startButton.click();
    return;
  }
  if (e.key === "Escape" && resultModal.open) {
    e.preventDefault();
    return;
  }
  if (
    englishLetters.includes(e.key.toLowerCase()) &&
    gameSection.hidden === false &&
    resultModal.open === false
  ) {
    hintDialog.show();
    setTimeout(() => hintDialog.close(), 1500);
    return;
  }
  if (gameSection.hidden || resultModal.open) return;
  const letterBox = letterBoxMap.get(normalizeArabic(e.key));
  if (letterBox && !letterBox.classList.contains("clicked")) {
    letterBox.classList.add("clicked");
    handleGuess(normalizeArabic(e.key));
  }
});
resultModal.addEventListener("cancel", (e) => e.preventDefault());
resultModalAgainBtn.addEventListener("click", (e) => {
  resetGame();
  startGame(gameState.category);
});
resultModalHomeBtn.addEventListener("click", (e) => {
  resetGame();
  gameSection.hidden = true;
  startScreen.hidden = false;
});
const showResultModal = (() => {
  let modalElements = null;
  return function (isWin) {
    if (!modalElements) {
      modalElements = {
        title: resultModal.querySelector(".result-modal__title"),
        subTitle: resultModal.querySelector(".result-modal__sub-title"),
        word: resultModal.querySelector(".result-modal__word"),
        description: resultModal.querySelector(".result-modal__description"),
        stats: resultModal.querySelector(".result-modal__stats"),
      };
    }
    modalElements.word.textContent = gameState.word;
    modalElements.description.textContent = gameState.description;
    modalElements.title.textContent = isWin
      ? "أحسنت! فوز رائع 🎉"
      : "للأسف، خسرت الجولة!";
    modalElements.subTitle.textContent = isWin
      ? "لقد تمكنت من تخمين الكلمة الصحيحة بنجاح"
      : "أتمنى لك حظا أفضل في المرة القادمة";
    modalElements.title.classList.toggle("is-win", isWin);
    modalElements.title.classList.toggle("is-lose", !isWin);
    modalElements.stats.hidden = !isWin;
    if (isWin) {
      const wrongRatio = gameState.wrongAttempts / gameState.maxAttempts;
      if (gameState.wrongAttempts === 0) {
        modalElements.stats.textContent =
          "🌟 عبقري! خمنت الكلمة بدون أي خطأ 🌟";
      } else if (wrongRatio < 0.4) {
        modalElements.stats.textContent = `أحسنت! خمنت الكلمة مع ${getMistakesText(gameState.wrongAttempts)} فقط.`;
      } else if (wrongRatio < 0.7) {
        modalElements.stats.textContent = `جيد جداً! أنهيت الجولة مع ${getMistakesText(gameState.wrongAttempts)}.`;
      } else {
        modalElements.stats.textContent = `نجوت بصعوبة مع ${getMistakesText(gameState.wrongAttempts)} من أصل ${gameState.maxAttempts}!`;
      }
    }
    setTimeout(() => {
      resultModal.showModal();
    }, 500);
  };
})();
setCategories();
function startGame(category) {
  startScreen.hidden = true;
  gameSection.hidden = false;
  gameState.category = category;
  categoryNameElement.textContent = categoriesData[category].title;
  maxAttemptsElement.textContent = gameState.maxAttempts;
  currentAttemptsElement.textContent = gameState.maxAttempts;
  const randomObj = getRandomItem(categoriesData[category].words);
  gameState.word = randomObj.name;
  gameState.description = randomObj.description;
  gameState.normalizeWord = normalizeArabic(gameState.word);
  gameState.wordArr = [...gameState.normalizeWord];
  lettersContainer.replaceChildren();
  lettersContainer.append(generateLetters());
  const { spans, spaceCount } = generateSpans(gameState.word);
  lettersGuessContainer.replaceChildren();
  lettersGuessContainer.append(spans);
  if (spaceCount > 0) gameState.revealedLettersCount = spaceCount;
}
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function generateLetters() {
  letterBoxMap.clear();
  const lettersArr = "ءابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");
  const fragment = document.createDocumentFragment();
  lettersArr.forEach((letter) => {
    const letterElement = document.createElement("button");
    letterElement.type = "button";
    letterElement.ariaLabel = `حرف ${letter}`;
    letterElement.classList.add("letter-box");
    letterElement.textContent = letter;
    fragment.append(letterElement);
    letterBoxMap.set(letter, letterElement);
  });
  return fragment;
}
function generateSpans(word) {
  const count = word.length;
  let spaceCount = 0;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    if (word[i] === " ") {
      span.classList.add("has-space");
      spaceCount++;
    }
    fragment.append(span);
  }
  return {
    spans: fragment,
    spaceCount: spaceCount,
  };
}
function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}
function setCategories() {
  const arrayOfKeys = [...Object.keys(categoriesData), "random"];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < arrayOfKeys.length; i++) {
    const key = arrayOfKeys[i];
    const categoryBox = document.createElement("div");
    const input = document.createElement("input");
    const label = document.createElement("label");
    const span = document.createElement("span");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    categoryBox.classList.add("category-list-box");
    span.classList.add("category-text");
    input.type = "radio";
    input.name = "category";
    input.value = key;
    input.id = key;
    label.htmlFor = key;
    span.textContent = categoriesData[key]?.title ?? "عشوائي";
    use.setAttribute("href", `#${key}-icon`);
    svg.append(use);
    label.append(svg, span);
    categoryBox.append(input, label);
    fragment.append(categoryBox);
    if (key === "random") input.checked = true;
  }
  categoryListElement.append(fragment);
}
function normalizeArabic(text) {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[ؤئ]/g, "ء");
}
function handleGuess(clickedLetter) {
  const isFound = revealMatchedLetters(clickedLetter);
  if (isFound) handleCorrectGuess();
  else handleWrongGuess();
}
function revealMatchedLetters(clickedLetter) {
  let isFound = false;
  const buttons = lettersGuessContainer.children;
  gameState.wordArr.forEach((letter, index) => {
    if (letter === clickedLetter) {
      buttons[index].textContent = gameState.word[index];
      gameState.revealedLettersCount++;
      isFound = true;
    }
  });
  return isFound;
}
function handleCorrectGuess() {
  playSound(sounds.success);
  if (gameState.revealedLettersCount === gameState.word.length) endGame(true);
}
function handleWrongGuess() {
  playSound(sounds.fail);
  gameState.wrongAttempts++;
  drawElements[gameState.wrongAttempts - 1].classList.add("show");
  currentAttemptsElement.textContent =
    gameState.maxAttempts - gameState.wrongAttempts;
  if (gameState.wrongAttempts >= gameState.maxAttempts) endGame(false);
}
function endGame(isWin) {
  lettersContainer.classList.add("finished");
  showResultModal(isWin);
}
function resetGame() {
  gameState.wrongAttempts = 0;
  gameState.revealedLettersCount = 0;
  lettersContainer.classList.remove("finished");
  drawElements.forEach((element) => element.classList.remove("show"));
  resultModal.close();
}
function getMistakesText(count) {
  if (count === 1) return "خطأ واحد";
  if (count === 2) return "خطأين";
  return `${count} أخطاء`;
}
