// Function for input focus handling

function goBack(key) {
    thisIndex = Number(this.dataset.index);
    thisRowIndex = this.parentElement.dataset.rowindex;
    thisValue = this.value;
    keyCode = key.code;
  
    if (keyCode.match(/Backspace/)) {
      // Go back one input
  
      if (thisIndex > 0 && thisValue == '') {
        document
          .querySelector(
            `div[data-rowindex="${thisRowIndex}"] input[data-index="${
              Number(thisIndex) - 1
            }"]`
          )
          .focus();
        return;
      }
    }
  }
  
  function goToNext(key) {
    thisIndex = Number(this.dataset.index);
    thisRowIndex = this.parentElement.dataset.rowindex;
    thisValue = this.value;
    keyCode = key.code;
  
    if (keyCode.match(/^Key[A-Z]$/)) {
      // Go forward one input
  
      if (thisIndex < 4) {
        document
          .querySelector(
            `div[data-rowindex="${thisRowIndex}"] input[data-index="${
              thisIndex + 1
            }"]`
          )
          .focus();
        return;
      }
    }
  }
  // Color handling for elements with a value
  
  function changeColor() {
    if (this != document.activeElement || this.value == '') return;
    switch (this.className) {
      case '':
        this.className = 'gray';
        break;
      case 'gray':
        this.className = 'yellow';
        break;
      case 'yellow':
        this.className = 'green';
        break;
      case 'green':
        this.className = 'gray';
        break;
      default:
        this.className = '';
    }
  }
  
  isMobile =
    'ontouchstart' in document.documentElement &&
    navigator.userAgent.match(/Mobi/); // Check if user is mobile
  
  // Function to add event listeners to inputs
  
  function addInputEventListeners() {
    inputs = document.querySelectorAll('input');
    inputs.forEach((input) => input.addEventListener('touchstart', changeColor));
    if (!isMobile) {
      inputs.forEach((input) => input.addEventListener('click', changeColor));
    }
    inputs = document.querySelectorAll('input');
    inputs.forEach((input) => input.addEventListener('keyup', goToNext));
    inputs.forEach((input) => input.addEventListener('keydown', goBack));
  }
  
  addInputEventListeners(); // Add to current input elements
  
  // Function to add new rows (current attached to green p element)
  
  function addRow() {
    rowsElement = document.querySelector('#rows-container');
    lastRow = rowsElement.querySelector('div:last-of-type');
    newRowIndex = Number(lastRow.dataset.rowindex) + 1;
    if (newRowIndex == 6) {
      document.querySelector('#add-row').style.display = 'none';
    }
    if (newRowIndex >= 7) return;
    rowString = `
    <input  placeholder=" " maxlength="1" class="gray" size="2" data-index="0"/>
    <input placeholder=" " maxlength="1" class="gray" size="2" data-index="1"/>
    <input placeholder=" " maxlength="1" class="gray" size="2" data-index="2"/>
    <input placeholder=" " maxlength="1" class="gray" size="2" data-index="3"/>
    <input placeholder=" " maxlength="1" class="gray" size="2" data-index="4"/> 
  `;
  
    newRow = document.createElement('div');
    newRow.id = `turn-${newRowIndex}`;
    newRow.className = 'row';
    newRow.dataset.rowindex = newRowIndex;
    newRow.innerHTML = rowString;
  
    rowsElement.append(newRow);
    addInputEventListeners();
    newRow.firstElementChild.focus();
  }
  
  document.querySelector('#add-row').addEventListener('click', addRow); // Add new row listener
  
  ////////////////////////////////////////////////////////////////////////
  //
  // Begin the main Wordle solving and results output function.
  //
  ////////////////////////////////////////////////////////////////////////
  
  function wordleSolver() {
    let wordList = completeWordList;
    let originalListLength = completeWordList.length;
  
    // Function to parse the letter and color inputs of a row.
  
    function createLetterArray(cssSelector) {
      let elements = document.querySelectorAll(cssSelector);
      let array = [];
      for (element of elements) {
        let elementValue = element.value.toUpperCase(); // Need regex replace
        if (!elementValue) continue;
        let elementIndex = element.dataset.index;
        array.push([elementValue, elementIndex]);
      }
  
      return array;
    }
  
    // This is the main function that iterates through the row "turns"
  
    function doTurn(rowIdName) {
      // Create the letter arrays for each color.
  
      greenLetters = createLetterArray(`#${rowIdName}>.green`);
      yellowLetters = createLetterArray(`#${rowIdName}>.yellow`);
      grayLetters = createLetterArray(`#${rowIdName}>.gray`);
  
      // Filter the wordList based on green letters
  
      for (letter of greenLetters) {
        let letterValue = letter[0];
        let index = letter[1];
        wordList = wordList.filter(
          (word) => word.split('')[index] == letterValue
        );
      }
  
      // Function to remove the green letters from the gray letter list.
  
      function removeGreenLetters(word, newChar) {
        cleanWord = word.split('');
        greenLetters.forEach((letter) => {
          let index = letter[1];
          cleanWord[index] = newChar;
        });
        return cleanWord.join('');
      }
  
      // Function to remove solved (green) positions from a wordList word for filtering.
  
      function removeSolvedPositions(word, newChar) {
        cleanWord = word.split('');
        greenLetters.forEach((letter) => {
          index = letter[1];
          cleanWord[index] = newChar;
        });
  
        return cleanWord.join('');
      }
  
      // Filter the wordList based on yellow letters
  
      for (letter of yellowLetters) {
        let letterValue = letter[0];
        let index = letter[1];
        wordList = wordList.filter((word) => {
          word = removeSolvedPositions(word, '_');
          return word.split('')[index] != letterValue && word.match(letterValue);
        });
  
        // Handler for duplicate yellows (only works for doubles, triples should be rare, but could iterate over another time)
  
        yellowLettersOnly = [];
        yellowLetters.forEach((letter) => yellowLettersOnly.push(letter[0]));
  
        duplicateYellows = yellowLettersOnly.filter(
          (letter, index) => yellowLettersOnly.indexOf(letter) != index
        );
  
        if (duplicateYellows.indexOf(letterValue) > -1) {
          wordList = wordList.filter((word) => {
            word = removeSolvedPositions(word, '_');
            word = word.replace(letterValue, '_');
            return (
              word.split('')[index] != letterValue && word.match(letterValue)
            );
          });
        }
      }
  
      // Filter the wordList based on gray letters
  
      for (letter of grayLetters) {
        let letterValue = letter[0];
        let index = letter[1];
        wordList = wordList.filter((word) => {
          word = removeGreenLetters(word, '');
          return !word.match(letterValue);
        });
      }
    }
  
    // Get all the rows and run them through the doTurn() function
  
    rows = document.querySelectorAll('.row');
  
    for (row of rows) {
      rowId = row.id;
      doTurn(rowId);
    }
  
    // End the initial solver and begin the output generation section.
  
    let wordListLength = wordList.length;
    let resultsString = '';
  
    linkText = `Nerdle found ${wordListLength} possible solutions to my Wordle puzzle. See my results!`;
  
    if (wordListLength == 0) {
      resultsString = `😭 No solutions where found.`;
      document.getElementById('word-list').style.display = 'none';
      document.getElementById('show-results').style.display = 'none';
    } else {
      resultsString = `There are ${wordListLength} possible solutions out of ${originalListLength} total words.`;
    }
  
    // Place the results count
  
    let resultsElement = document.getElementById('results');
    resultsElement.innerHTML = resultsString;
  
    // Generate soluton string and place it
  
    let wordListElement = document.getElementById('word-list');
  
    if (wordListLength == 1) {
      wordListString = `<strong>🏆 There's only one solution left!</strong><ol>`;
    } else {
      wordListString = '<strong>👀 Possible Solutions:</strong><ol>';
    }
  
    wordList.forEach((item, index, arr) => {
      if (index < 20) {
        wordListString += `<li>${item}</li>`;
      }
    });
  
    wordListString += '</ol>';
  
    if (wordListLength > 20) {
      wordListString += '...Enter more information to reduce the list size.';
    }
  
    wordListElement.innerHTML = '';
    wordListElement.innerHTML = wordListString;
    wordListElement.style.display = 'none';
  
    // Display "show results" text
  
    if (wordListLength > 0) {
      let showResultsElement = document.getElementById('show-results');
      showResultsElement.style.display = 'block';
      showResultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  
    // Display results in the console
  
    //console.log(wordList);
  }
  
  document
    .querySelector('#get-solutions')
    .addEventListener('click', wordleSolver);
  
  // Function attached to "See the solutions"
  
  function showResults() {
    document.getElementById('show-results').style.display = 'none';
    let wordListElement = document.getElementById('word-list');
    wordListElement.style.display = 'block';
    wordListElement.scrollIntoView({ behavior: 'smooth' });
  }
  
  document.querySelector('#show-results').addEventListener('click', showResults);
  
  // Function to reset the form via nerd emoji
  
  function resetForm() {
    document.querySelector('#add-row').style.display = '';
    rowsElement = document.querySelector('#rows-container');
    rowsElement.innerHTML = `<div class="row" id="turn-1" data-rowindex="1">
        <input class="gray" maxlength="1" size="2" value="" placeholder=" " data-index="0" / >
        <input class="gray" maxlength="1" size="2" value="" placeholder=" " data-index="1" / >
        <input class="gray" maxlength="1" size="2" value="" placeholder=" " data-index="2" / >
        <input class="gray" maxlength="1" size="2" value="" placeholder=" " data-index="3" / >
        <input class="gray" maxlength="1" size="2" value="" placeholder=" " data-index="4" / >
      </div>`;
    addInputEventListeners();
    document.querySelectorAll('input').forEach((elem) => (elem.value = ''));
    document.getElementById('word-list').style.display = 'none';
    document.getElementById('show-results').style.display = 'none';
    document.getElementById('results').innerText = '';
    document.getElementById('nerd').innerText = '✅';
  }
  
  document.querySelector('#nerd').addEventListener('click', resetForm);
  