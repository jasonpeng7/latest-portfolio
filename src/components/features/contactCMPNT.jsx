"use client";

import { motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";
import { Fragment, useEffect, useRef, useState } from "react";

const QUESTIONS = [
  {
    key: "message",
    text: "Feel free to ",
    postfix: "tell me anything!",
    complete: false,
    value: "",
  },
];

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

  const handleReset = () => {
    setQuestions((prev) =>
      prev.map((q) => ({ ...q, value: "", complete: false }))
    );
    setComplete(false);
  };

  const handleSend = () => {
    const message = questions.find((q) => q.key === "message")?.value || "";

    // create email with user content
    const subject = encodeURIComponent("Portfolio Contact - Jason Peng");
    const body = encodeURIComponent(`${message}

Best regards,
[Your name]`);

    // open default mail client
    const mailtoLink = `mailto:jiapeng@ucdavis.edu?subject=${subject}&body=${body}`;
    window.open(mailtoLink, "_blank");

    setComplete(true);
  };

  return (
    <>
      <p>Awesome! Here&apos;s what I&apos;ve got:</p>
      {questions.map((q) => (
        <p key={q.key}>
          <span className="text-blue-300">{q.key}:</span> {q.value}
        </p>
      ))}
      <p>Ready to send?</p>

      {complete ? (
        <p className="text-emerald-300 flex items-center gap-2">
          <FiCheckCircle />
          <span>
            Opened your client for you ;) I&apos;ll get back to you ASAP 😎
          </span>
        </p>
      ) : (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleReset}
            className="px-3 py-1 text-base rounded bg-slated-100 text-black hover:opacity-90 transition-opacity"
          >
            Restart
          </button>
          <button
            onClick={handleSend}
            className="px-3 py-1 text-base rounded text-white bg-indigo-500 hover:opacity-90 transition-opacity"
          >
            Send Email
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
        {command && <span className="opacity-50">Enter message: </span>}
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
