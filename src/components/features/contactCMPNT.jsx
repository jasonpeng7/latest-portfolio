// components/TerminalContact.jsx
"use client";

import { motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";
import { Fragment, useEffect, useRef, useState } from "react";

const QUESTIONS = [
  {
    key: "email",
    text: "To start, could you give me ",
    postfix: "your email?",
    complete: false,
    value: "",
  },
  {
    key: "name",
    text: "Thanks! And what's ",
    postfix: "your name?",
    complete: false,
    value: "",
  },
  {
    key: "description",
    text: "Perfect, and ",
    postfix: "your message?",
    complete: false,
    value: "",
  },
];

const API_URL = "http://localhost:3000";

export default function TerminalContact() {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  return (
    <section className="flex flex-col items-center justify-center px-4 sm:px-16 mb-[30px]">
      {/* Terminal “window” */}
      <div
        ref={containerRef}
        onClick={() => {
          inputRef.current?.focus();
        }}
        className="
          h-96
          w-full max-w-3xl
          mx-auto
          bg-slated-950/70
          backdrop-blur
          rounded-lg
          overflow-y-scroll
          shadow-xl
          cursor-text
          font-mono
        "
      >
        <TerminalHeader />
        <TerminalBody inputRef={inputRef} containerRef={containerRef} />
      </div>
    </section>
  );
}

function TerminalHeader() {
  return (
    <div className="sticky top-0 w-full p-3 bg-dark-navy flex items-center gap-1">
      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
      <span className="absolute left-1/2 -translate-x-1/2 text-sm text-slated-200 font-semibold">
        jasonpeng@myemail.dev
      </span>
    </div>
  );
}

function TerminalBody({ inputRef, containerRef }) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState(QUESTIONS);

  const curQuestion = questions.find((q) => !q.complete);

  const handleSubmitLine = (value) => {
    if (!curQuestion) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.key === curQuestion.key ? { ...q, complete: true, value } : q
      )
    );
  };

  return (
    <div className="p-2 text-slated-100 text-lg">
      <InitialText />
      <PreviousQuestions questions={questions} />
      <CurrentQuestion curQuestion={curQuestion} />

      {curQuestion ? (
        <CurLine
          text={text}
          focused={focused}
          setText={setText}
          setFocused={setFocused}
          inputRef={inputRef}
          command={curQuestion.key}
          handleSubmitLine={handleSubmitLine}
          containerRef={containerRef}
        />
      ) : (
        <Summary questions={questions} setQuestions={setQuestions} />
      )}
    </div>
  );
}

function InitialText() {
  return (
    <>
      <p>Hey there! My name is Jason, I'm excited to connect! 🔗</p>
      <p className="font-light overflow-hidden whitespace-nowrap">
        ------------------------------------------------------------------------
      </p>
    </>
  );
}

function PreviousQuestions({ questions }) {
  return (
    <>
      {questions.map((q, i) =>
        q.complete ? (
          <Fragment key={i}>
            <p>
              {q.text}
              {q.postfix && (
                <span className="text-violet-300">{q.postfix}</span>
              )}
            </p>
            <p className="text-emerald-300">
              <FiCheckCircle className="inline-block mr-2" />
              <span>{q.value}</span>
            </p>
          </Fragment>
        ) : null
      )}
    </>
  );
}

function CurrentQuestion({ curQuestion }) {
  if (!curQuestion) return null;
  return (
    <p>
      {curQuestion.text}
      {curQuestion.postfix && (
        <span className="text-violet-300">{curQuestion.postfix}</span>
      )}
    </p>
  );
}

function Summary({ questions, setQuestions }) {
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = () => {
    setQuestions((prev) =>
      prev.map((q) => ({ ...q, value: "", complete: false }))
    );
    setError("");
    setComplete(false);
  };

  const handleSend = async () => {
    setIsLoading(true);
    setError("");

    try {
      const formData = questions.reduce(
        (acc, q) => ({ ...acc, [q.key]: q.value }),
        {}
      );

      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send");

      setComplete(true);
    } catch (err) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <p>Awesome! Here’s what we’ve got:</p>
      {questions.map((q) => (
        <p key={q.key}>
          <span className="text-blue-300">{q.key}:</span> {q.value}
        </p>
      ))}
      <p>Look good?</p>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {complete ? (
        <p className="text-emerald-300 flex items-center gap-2">
          <FiCheckCircle />
          <span>Sent! I’ll get back to you ASAP 😎</span>
        </p>
      ) : (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleReset}
            className="px-3 py-1 text-base rounded bg-slated-100 text-black hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            Restart
          </button>
          <button
            onClick={handleSend}
            className={`px-3 py-1 text-base rounded text-white hover:opacity-90 transition-opacity ${
              isLoading ? "bg-indigo-400" : "bg-indigo-500"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send it!"}
          </button>
        </div>
      )}
    </>
  );
}

function CurLine({
  text,
  focused,
  setText,
  setFocused,
  inputRef,
  command,
  handleSubmitLine,
  containerRef,
}) {
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmitLine(text);
    setText("");
    setTimeout(scrollToBottom, 0);
  };

  const onChange = (e) => {
    setText(e.target.value);
    scrollToBottom();
  };

  useEffect(() => {
    return () => setFocused(false);
  }, []);

  return (
    <>
      <form onSubmit={onSubmit} className="sr-only">
        <input
          ref={inputRef}
          onChange={onChange}
          value={text}
          type="text"
          autoComplete="off"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </form>
      <p>
        <span className="text-emerald-400">➜</span>{" "}
        <span className="text-cyan-300">~</span>{" "}
        {command && <span className="opacity-50">Enter {command}: </span>}
        {text}
        {focused && (
          <motion.span
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: "linear",
              times: [0, 0.5, 0.5, 1],
            }}
            className="inline-block w-2 h-5 bg-slated-400 translate-y-[4px] ml-0.5"
          />
        )}
      </p>
    </>
  );
}
