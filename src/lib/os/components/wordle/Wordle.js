import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import WORDS from './Words';
import { Easing } from '../general/Animation';
const KeyboardLetter = ({ letter, guesses, word, currentGuess, setGuesses, setCurrentGuess, }) => {
    const [isInWord, setIsInWord] = useState(false);
    const [isInPlace, setIsInPlace] = useState(false);
    const [notInWord, setNotInWord] = useState(false);
    useEffect(() => {
        guesses.forEach((guess) => {
            if (word.includes(letter) && guess.includes(letter)) {
                setIsInWord(true);
                if (word.indexOf(letter) === guess.indexOf(letter)) {
                    setIsInPlace(true);
                }
            }
            if (!word.includes(letter) && guess.includes(letter)) {
                setNotInWord(true);
            }
        });
        if (guesses.length === 0) {
            setIsInPlace(false);
            setIsInWord(false);
            setNotInWord(false);
        }
    }, [guesses, letter, word]);
    const handleClick = () => {
        if (letter === 'RET') {
            if (currentGuess.length === word.length) {
                if (WORDS.includes(currentGuess.toLowerCase())) {
                    setGuesses([...guesses, currentGuess]);
                    setCurrentGuess('');
                }
            }
        }
        else if (letter === 'DEL') {
            setCurrentGuess(currentGuess.slice(0, -1));
        }
        else if (currentGuess.length < word.length) {
            setCurrentGuess(currentGuess + letter.toUpperCase());
        }
    };
    return (React.createElement("div", { onMouseDown: handleClick, className: "site-button", style: Object.assign({}, styles.letterBox, isInWord && { backgroundColor: 'yellow' }, isInPlace && { backgroundColor: 'lightgreen' }, notInWord && { backgroundColor: 'gray' }) },
        React.createElement("p", null, letter)));
};
const GuessLetter = ({ guessed, letter, guess, word, }) => {
    const [isInWord, setIsInWord] = useState(false);
    const [isInPlace, setIsInPlace] = useState(false);
    useEffect(() => {
        if (guessed) {
            if (word.includes(letter)) {
                setIsInWord(true);
                if (word.indexOf(letter) === guess.indexOf(letter)) {
                    setIsInPlace(true);
                }
            }
        }
    }, [guessed, guess, letter, word]);
    return (React.createElement("div", { className: "button-border", style: Object.assign({}, styles.guessLetterBox, isInWord && { backgroundColor: 'yellow' }, isInPlace && { backgroundColor: 'lightgreen' }, !guessed && { backgroundColor: 'white' }, letter === ' ' && styles.emptyBox) },
        React.createElement("h3", null,
            React.createElement("b", null, letter.toUpperCase()))));
};
const GuessWord = ({ guess, guesses, word, active, noClear, }) => {
    const [savedGuess, setSavedGuess] = useState(guess);
    const controls = useAnimation();
    useEffect(() => {
        if (active) {
            setSavedGuess(guess);
            if (guess.length === word.length &&
                !WORDS.includes(guess.toLowerCase())) {
                controls
                    .start({
                    backgroundColor: '#f00',
                    x: 2,
                    transition: {
                        duration: 0.1,
                    },
                })
                    .then(() => {
                    controls
                        .start({
                        x: -4,
                        backgroundColor: '#fff',
                        transition: {
                            duration: 0.1,
                        },
                    })
                        .then(() => {
                        controls.start({
                            x: 0,
                            backgroundColor: '#fff',
                            transition: {
                                duration: 0.09,
                            },
                        });
                    });
                });
            }
        }
    }, [guess, active, word, controls]);
    useEffect(() => {
        if (guesses.length === 0 && !noClear)
            setSavedGuess('');
    }, [guesses, noClear]);
    return (React.createElement(motion.div, { animate: controls, style: styles.guessWordRow },
        savedGuess.split('').map((letter, index) => (React.createElement(GuessLetter, { guessed: !active, key: index, letter: letter, guess: savedGuess, word: word }))),
        [...Array(word.length - savedGuess.length)].map((e, i) => (React.createElement(GuessLetter, { guessed: !active, key: i, letter: ' ', guess: savedGuess, word: word })))));
};
const TOP_ROW = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const MIDDLE_ROW = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const BOTTOM_ROW = ['RET', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'];
const ROWS = [TOP_ROW, MIDDLE_ROW, BOTTOM_ROW];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const Wordle = () => {
    const word = 'HENRY';
    const [guesses, setGuesses] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [currentGuess, setCurrentGuess] = useState('');
    const restart = () => {
        setGuesses([]);
        setGameOver(false);
        setTimeout(() => {
            setWon(false);
        }, 500);
        setCurrentGuess('');
    };
    // listen to keyboard events
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.target.closest("input, textarea")) return;
            if (event.key === 'Backspace') {
                setCurrentGuess(currentGuess.slice(0, -1));
            }
            else if (event.key === 'Enter') {
                if (currentGuess.length === word.length) {
                    if (WORDS.includes(currentGuess.toLowerCase())) {
                        setGuesses([...guesses, currentGuess]);
                        setCurrentGuess('');
                    }
                }
            }
            else if (event.key.length === 1 &&
                ALPHABET.includes(event.key.toUpperCase())) {
                if (currentGuess.length < word.length) {
                    setCurrentGuess(currentGuess + event.key.toUpperCase());
                }
            }
        };
        // add listener
        window.addEventListener('keydown', handleKeyDown);
        // cleanup listener
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [guesses, currentGuess]);
    useEffect(() => {
        if (guesses.length === 6) {
            setGameOver(true);
        }
        guesses.forEach((guess) => {
            if (guess === word) {
                setGameOver(true);
                setWon(true);
            }
        });
    }, [guesses]);
    return (React.createElement("div", { style: styles.container },
        React.createElement("div", { style: styles.header },
            React.createElement("h2", null, "JasonWord"),
            React.createElement("p", null, "Wordle but with a HENRY based twist.")),
        React.createElement(motion.div, { variants: gameOverAnimations, animate: gameOver ? 'show' : 'hidden', initial: false, style: Object.assign({}, styles.gameOverContainer, gameOver && { zIndex: 1000 }) },
            React.createElement("h2", null, won ? 'You win!' : 'Game Over'),
            React.createElement("p", null, "Thanks for playing! Remember: the word is always \"HENRY\"!"),
            React.createElement("br", null),
            React.createElement(GuessWord, { key: 'winning-guess', guess: word, word: word, guesses: guesses, active: false, noClear: true }),
            React.createElement("br", null),
            React.createElement("div", { className: "site-button", onMouseDown: restart }, "Restart Game")),
        React.createElement(motion.div, { variants: gameAnimations, animate: !gameOver ? 'show' : 'hidden', initial: false, style: styles.gameContainer },
            React.createElement("div", { style: styles.playArea }, [...Array(6)].map((e, i) => (React.createElement(GuessWord, { key: i, guess: currentGuess, word: word, guesses: guesses, active: i === guesses.length })))),
            React.createElement("div", { style: styles.keyboardContainer }, ROWS.map((row) => (React.createElement("div", { style: styles.keyboardRow, key: `row-${row[0]}` }, row.map((letter) => (React.createElement(KeyboardLetter, { key: letter, word: word, setGuesses: setGuesses, guesses: guesses, letter: letter, currentGuess: currentGuess, setCurrentGuess: setCurrentGuess }))))))))));
};
const gameAnimations = {
    hidden: {
        opacity: 0,
        y: -12,
        transition: {
            duration: 0.5,
        },
    },
    show: {
        y: 0,
        opacity: 1,
        transition: {
            delay: 0.5,
            duration: 0.5,
        },
    },
};
const gameOverAnimations = {
    hidden: {
        opacity: 0,
        y: 32,
        transition: {
            duration: 0.5,
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.4,
            duration: 0.5,
            ease: Easing.expOut,
        },
    },
};
const styles = {
    container: {
        flex: 1,
        flexDirection: 'column',
        overflowY: 'scroll',
    },
    gameContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    gameOverContainer: {
        zIndex: -1000,
        textAlign: 'center',
        width: '100%',
        height: '100%',
        position: 'absolute',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexShrink: 1,
        paddingTop: 32,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardContainer: {
        flexShrink: 1,
        paddingBottom: 24,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playArea: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 16,
    },
    letterBox: {
        padding: 12,
        paddingTop: 16,
        minWidth: 42,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 16,
        margin: 4,
    },
    keyboardRow: {},
    guessLetterBox: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
    },
    guessWordRow: {},
    emptyBox: {
        border: '2px solid gray',
        backgroundColor: 'white',
        boxShadow: 'none',
    },
};
export default Wordle;
