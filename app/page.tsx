"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const TOTAL_TIME = 60;
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

// CVCV, CCVC, CVCC, CVVC, Other
let startingWords = ["came", "flat", "lots", "bead", "tree"];

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
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME * 1000);
  const [gameover, setGameover] = useState(false);
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
    if (gameState.gameStatus != GameStateEnums.GAME_OVER) { 
    const { error } = await supabase
      .from("scores")
      .insert([
        {
          age: age,
          score: gameState.usedWords.length - 1, // Adjust for the starting word
          starting_word: startingWords[gameState.currentRound],
          user_id: userId,
        },
      ])
      .select();
    console.log(gameState);
    }
  };

  const handleStartRound = () => {
    if (gameState.currentRound < startingWords.length - 1) {
      setGameState({
        ...gameState,
        currentRound: gameState.currentRound + 1,
        gameStatus: GameStateEnums.ROUND_IN_PROGRESS,
        currentWord: startingWords[gameState.currentRound + 1],
        usedWords: [startingWords[gameState.currentRound + 1]],
      });
      setTimeLeft(TOTAL_TIME);
    }
  };

  if (timeLeft <= 0 && gameState.gameStatus != GameStateEnums.ROUND_ENDED) {
    setGameState({
      ...gameState,
      gameStatus: GameStateEnums.ROUND_ENDED,
      newWord: ""
      });
    recordScore();
  }

  if (timeLeft <= 0 && gameState.gameStatus == GameStateEnums.ROUND_ENDED && 
    gameState.currentRound == startingWords.length - 1) {
      setGameState({
        ...gameState,
        gameStatus: GameStateEnums.GAME_OVER,
        currentRound: 0,
    }); 
    setGameover(true);
  }

  let score = gameState.usedWords.length - 1;

  interface Color {
    className: string;
  }
  const ColorfulList = (strings:string[]) => {
    const colors: Color[] = [
      { className: 'text-red-500' },
      { className: 'text-yellow-400' },
      { className: 'text-slate-600' },
      { className: 'text-purple-700' },
      { className: 'text-blue-400' },
    ];
  
    return (
      <div>
        {strings.map((string, index) => (
          <span key={index} className={colors[index % colors.length].className}>
            {string}-
          </span>
        ))}
      </div>
    );
  }

  const InstructionsList = () => {
    return (
      <div>
      <p className="mb-4 text-lg text-gray-500 mt-4">Instructions:</p>
        <ul className="list-disc space-y-2 pl-4 text-lg mb-4">
          <li>We will give you a 4 letter starting word.</li>
          <li>The new word you guess must be a valid English word and <b>only one letter</b> different from the previous word!</li>
          <li>You have 1 minute to keep it going as long as you can think of words that follow the chain rule.</li>
          <li><b>No repeats: </b> You cannot use the same word twice!</li>
          <li><b>Example: </b>BEAR-FEAR-FEAT-NEAT-MEAT-MEAN-LEAN-BEAN-BEAT</li>
        </ul>
      </div>
    );
  }

  return (
    <main className="container relative flex flex-col justify-between h-full max-w-6xl px-10 mx-auto xl:px-0 mt-5">
      {gameState.gameStatus == GameStateEnums.GAME_NOT_STARTED && (
          <div className="word-chain-game">
            <h1 className="mb-1 text-3xl font-extrabold leading-tight text-gray-900">Welcome to Word Chain!</h1>
            <div className="border-solid border-2 border-gray-500 rounded-md"> <h2 className="px-2 py-2 mb-1 text-1xl leading-tight text-gray-900">This game was made by Saanvi Narla (using some help), 3rd grade at Cedar Crest Academy, Bellewood. <br/><br/>The game is a science experiment to see how people of different ages perform on the game. No personal information is collected other than age.</h2>
            </div>
            {InstructionsList()}
            <p className="mb-4 text-lg text-gray-500">Enter your age to begin:</p>
            <input className="w-full py-3 px-4 border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500" type="number" value={age} onChange={handleAgeChange} />
            <button className="w-full bg-green-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg focus:outline-none mt-2" onClick={handleStartRound}>
              Start Round {gameState.currentRound + 2} / {startingWords.length}
            </button>
          </div>
        )}
      {gameState.gameStatus == GameStateEnums.ROUND_IN_PROGRESS && (
        <div className="container relative flex flex-col justify-between word-chain-game">
          <h1 className="mb-1 text-3xl font-extrabold leading-tight text-gray-900">Welcome to Word Chain!</h1>
          <div>
            <h2 className="mb-3 text-2xl font-bold leading-tight text-gray-700">Time Left: {timeLeft} seconds</h2>
            <h3 className="mb-3 text-2xl font-bold leading-tight text-gray-700 whitespace-wrap">{ColorfulList(gameState.usedWords)}</h3>
            <p className="mb-2 items-center text-gray-600">Enter a new word that differs by only 1 letter (hit Enter to submit word):</p>
            <input className="w-full py-3 px-4 border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
              type="text"
              value={gameState.newWord}
              onKeyDown={handleKeyDown}
              onChange={handleWordChange}
              autoFocus
            />
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <h4 className="mb-2 flex text-3xl font-extrabold items-center text-lime-600">Score: {score}</h4>
            {InstructionsList()}
          </div>
        </div>
      )}
      {gameState.gameStatus == GameStateEnums.ROUND_ENDED && (
        <div className="word-chain-game">
          <h1 className="mb-1 text-3xl font-extrabold leading-tight text-gray-900">Welcome to Word Chain!</h1>
            <h2 className="mb-3 text-2xl font-bold leading-tight text-lime-700 whitespace-wrap">You scored {score} points in that round.</h2>
            {gameover && <h2 className="mb-3 text-2xl mt-6 leading-tight text-gray-700">🙏 Thanks for playing and helping my science experiment. Please share with a friend so I can collect more data and improve my science experiment. <br/><br/>- Saanvi Narla</h2>}
            {!gameover && <button className="w-full bg-green-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg focus:outline-none mt-2"
            onClick={handleStartRound}>Start round {gameState.currentRound + 2} / {startingWords.length} </button>}
        </div>
      )}
    </main>
  );
}
