'use client'

import Image from "next/image";
import React, { useState, useEffect } from 'react';

const SAVE_SCORE_URL = "/api/score";
const TOTAL_TIME = 60;

export default function Home() {

  const [age, setAge] = useState(0);
  const [startGame, setStartGame] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [startingWord, setStartingWord] = useState('');
  const [newWord, setNewWord] = useState('');
  const [usedWords, setUsedWords] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');

  // Function to load words from a text file
  const wordList: string[] = []; // Placeholder for the word list

  useEffect(() => {
    const loadWords = async() => {
      try {
          const response = await fetch('./data/wordlist.txt'); // Replace with the actual file path
          const text = await response.text();
          wordList.push(...text.trim().split("\n"));
      } catch (error) {
          console.error("Error loading word list:", error);
          alert("Failed to load word list. Please check the file path.");
      }
    }
    loadWords();
  }, [wordList]);

  useEffect(() => {
    if (startGame && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prevTime => prevTime - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      handleGameOver(); // Automatically save score on timeout
    }
  }, [startGame, timeLeft]);

  const handleGameOver = async () => {
    const finalScore = usedWords.size;
    try {
      const response = await fetch(SAVE_SCORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingWord: startingWord, score: finalScore, age: age }),
      });
      if (!response.ok) {
        throw new Error('Failed to save score');
      }
      console.log('Score saved successfully!');
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const handleAgeChange = (event: { target: { value: string; }; }) => {
    setAge(parseInt(event.target.value));
  };

  const handleStartGame = () => {
    if (age > 0) {
      setStartGame(true);
      setCurrentWord(getRandomWord());
      setUsedWords(new Set());
      setTimeLeft(TOTAL_TIME);
    } else {
      alert('Please enter a valid age');
    }
  };

  const getRandomWord = () => {
    let startingWords = ["dark", "rose", "kiss", "ball"];
    const randomIndex = Math.floor(Math.random() * startingWords.length);
    setStartingWord(startingWords[randomIndex]);
    return startingWords[randomIndex];
  };

 const isRealWord = (word :string) => {
    // You can use a third-party library to check for real words
    // For simplicity, this example assumes the word list contains valid words
    return wordList.includes(word.toLowerCase());
}

const handleWordChange = (event : any) => {
  setNewWord(event.target.value);
};

const handleKeyDown = (event : any) => {
  if (event.key === 'Enter') {
    const typedWord = event.target.value.toLowerCase();
    if (isValidWord(typedWord)) {
      setCurrentWord(typedWord);
      setNewWord("");
      setUsedWords(prevUsedWords => new Set(prevUsedWords).add(typedWord));
      setErrorMessage(''); // Clear error message on valid input
    } else {
      setErrorMessage('Invalid word, or already used. Please try again.');
    }
  }
};

  const isValidWord = (newWord : string) => {
    if (newWord.length !== currentWord.length) return false;
    let differences = 0;
    for (let i = 0; i < newWord.length; i++) {
      if (newWord[i] !== currentWord[i]) {
        differences++;
        if (differences > 1) return false;
      }
    }
    return !usedWords.has(newWord) && isRealWord(newWord);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="word-chain-game">
      {!startGame && (
        <div>
          <h1>Welcome to Word Chain!</h1>
          <p>Enter your age to begin:</p>
          <input type="number" value={age} onChange={handleAgeChange} />
          <button onClick={handleStartGame}>Start Game</button>
        </div>
      )}
      {startGame && (
        <div className="word-chain-game">
          <h1>Welcome to Word Chain!</h1>
          <h2>Time Left: {timeLeft} seconds</h2>
          <h3>Word: {currentWord}</h3>
          <p>Score: {usedWords.size}</p>
          <p>Enter a new word that differs by only 1 letter:</p>
          <input type="text" value={newWord} onKeyDown={handleKeyDown} onChange={handleWordChange}/>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {gameOver && <p>Time`&apos;` Up! You scored {usedWords.size} points.</p>}
        </div>
      )}
    </div>
    </main>
  );
}
