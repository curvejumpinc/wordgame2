"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { start } from "repl";

const TOTAL_TIME = 5;
const GameStateEnums = {
  GAME_NOT_STARTED: "NOT_STARTED",
  ROUND_NOT_STARTED: "ROUND_NOT_STARTED",
  ROUND_STARTED: "ROUND_STARTED",
  ROUND_IN_PROGRESS: "ROUND_IN_PROGRESS",
  ROUND_ENDED: "ROUND_ENDED",
  GAME_OVER: "GAME_OVER",
};

interface GameState {
  gameStatus: string,
  currentRound: number,
  currentWord: string,
  usedWords: string[],
  newWord: string,
}

// let startingWords = ["dark", "rose", "kiss", "ball"];
let startingWords = ["dark", "rose"];

const generateRandomId = (length: number = 16): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const userId = generateRandomId(8);

export default function Home() {
  const [age, setAge] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [gameState, setGameState] = useState<GameState>({
    gameStatus: GameStateEnums.GAME_NOT_STARTED,
    currentRound: -1,
    currentWord: "",
    usedWords: [],
    newWord: "",
  });
  const [wordList, setWordList] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadWords = async () => {
      try {
        const response = await fetch("./data/wordlist.txt"); // Replace with the actual file path
        const text = await response.text();
        wordList.push(...text.trim().split("\n"));
        console.log("Loaded words", wordList.length);
      } catch (error) {
        console.error("Error loading word list:", error);
        alert("Failed to load word list. Please check the file path.");
      }
    };
    loadWords();
  }, [wordList]);

  useEffect(() => {
    if (timeLeft > 0) {
      const intervalId = setInterval(() => {
        setTimeLeft((prevSeconds) => Math.max(0, prevSeconds - 1));
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [timeLeft]);

  const handleAgeChange = (event: { target: { value: string } }) => {
    setAge(parseInt(event.target.value));
  };

  const isRealWord = (word: string) => {
    return wordList.includes(word.toLowerCase());
  };

  const handleWordChange = (event : any) => {
    setGameState({...gameState, newWord: event.target.value});
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      const typedWord = event.target.value.toLowerCase();
      if (isValidWord(typedWord)) {
        setGameState({
          ...gameState,
          newWord: "",
          currentWord: typedWord,
          // usedWords: gameState.usedWords.concat(gameState.usedWords, [typedWord]),
          usedWords: [...gameState.usedWords, typedWord],
        });
        setErrorMessage(""); // Clear error message on valid input
      } else {
        setErrorMessage("Invalid word, or already used. Please try again.");
      }
    }
  };

  const isValidWord = (newWord: string) => {
    if (newWord.length !== gameState.currentWord.length) return false;
    let differences = 0;
    for (let i = 0; i < newWord.length; i++) {
      if (newWord[i] !== gameState.currentWord[i]) {
        differences++;
        if (differences > 1) return false;
      }
    }
    return !gameState.usedWords.includes(newWord) && isRealWord(newWord);
  };

  // Save the score after each round
  const recordScore = async () => {
    const { error } = await supabase
      .from("scores")
      .insert([
        {
          age: age,
          score: gameState.usedWords.length,
          starting_word: startingWords[gameState.currentRound],
          user_id: userId,
        },
      ])
      .select();
    console.log(error);
  };

  const handleStartRound = () => {
    if (gameState.currentRound < startingWords.length - 1) {
      setGameState({
        ...gameState,
        currentRound: gameState.currentRound + 1,
        gameStatus: GameStateEnums.ROUND_IN_PROGRESS,
        currentWord: startingWords[gameState.currentRound + 1],
        usedWords: [],
      });
      setTimeLeft(TOTAL_TIME);
    }
  };

  if (timeLeft <= 0 && gameState.gameStatus != GameStateEnums.ROUND_ENDED) {
    // recordScore();
    setGameState({ ...gameState,
      gameStatus: GameStateEnums.ROUND_ENDED,
      newWord: ""
      });
  }

  if (timeLeft <= 0 && gameState.gameStatus == GameStateEnums.ROUND_ENDED && 
    gameState.currentRound == startingWords.length - 1) {
      console.log("Game has ended");
      setGameState({ ...gameState,
        gameStatus: GameStateEnums.GAME_OVER,
        currentRound: 0,
    }); 
  }

  if (gameState.gameStatus == GameStateEnums.GAME_OVER) {
    alert("game over");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      {gameState.gameStatus == GameStateEnums.GAME_NOT_STARTED && (
          <div className="word-chain-game">
            <h1>Welcome to Word Chain!</h1>
            <p>Enter your age to begin:</p>
            <input type="number" value={age} onChange={handleAgeChange} />
            <button onClick={handleStartRound}>
              Start Round 1 / 3
            </button>
          </div>
        )}
      {gameState.gameStatus == GameStateEnums.ROUND_IN_PROGRESS && (
        <div className="word-chain-game">
          <h1>Word Chain</h1>
          <div>
            <h2>Time Left: {timeLeft} seconds</h2>
            <h3>Chain: {startingWords[gameState.currentRound]}-{gameState.usedWords.join('-')}</h3>
            <p>Score: {gameState.usedWords.length}</p>
            <p>Enter a new word that differs by only 1 letter:</p>
            <input
              type="text"
              value={gameState.newWord}
              onKeyDown={handleKeyDown}
              onChange={handleWordChange}
            />
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>
        </div>
      )}
      {gameState.gameStatus == GameStateEnums.GAME_OVER && (
        <div className="word-chain-game">
          <h1>Word Chain</h1>
          <div>
            <p>Thanks for playing!</p>
          </div>
        </div>
      )}
      {gameState.gameStatus == GameStateEnums.ROUND_ENDED && (
        <div className="word-chain-game">
          <h1>Word Chain</h1>
          <div>
            <p>Score: {gameState.usedWords.length}</p>
            <p>
              Round {gameState.currentRound + 1}: You scored{" "}
              {gameState.usedWords.length} points.
            </p>
            <button onClick={handleStartRound}>Start next round</button>
          </div>
        </div>
      )}
    </main>
  );
}
