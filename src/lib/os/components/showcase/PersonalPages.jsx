import React, { useEffect, useRef, useState } from 'react';
import { profile, skills, projects, experiences } from '@/data/portfolio';

export function About() {
  return <article className="site-page-content personal-content"><h1>About</h1><div className="personal-about"><img className="portrait" src={profile.portrait} alt="Jason Peng" width="220" height="220" /><div><h2>Hi, I’m Jason.</h2><p>{profile.bio}</p></div></div><h2>My toolkit</h2><p>Tools I use across web development, mobile apps, and backend systems.</p><div className="skills-list">{skills.map(skill => <span key={skill}>{skill}</span>)}</div><div className="social-links"><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a></div></article>;
}
export function Experience() {
  return <article className="site-page-content personal-content"><h1>Experience</h1>{experiences.map(job => <section className="job-entry" key={job.company}><div className="job-heading">{job.logo && <img src={job.logo} alt={`${job.company} logo`} width="48" height="48" />}<div><h2>{job.company}</h2><h3>{job.title}</h3></div><time>{job.date}</time></div>{job.description && <p>{job.description}</p>}</section>)}</article>;
}
export function Projects() {
  const [selected, setSelected] = useState(null);
  const [slide, setSlide] = useState(0);
  const page = useRef(null);
  useEffect(() => { if (page.current) page.current.scrollTop = 0; }, [selected]);
  if (selected) {
    const images = [selected.image, ...selected.gallery];
    return <article ref={page} className="site-page-content personal-content"><button className="site-button back-button" onClick={() => setSelected(null)}>← All projects</button><h1>{selected.name}</h1>{selected.context && <p className="project-context">{selected.context}</p>}<div className="project-gallery"><img src={images[slide]} alt={slide === 0 && selected.imageAlt ? selected.imageAlt : `${selected.name} preview ${slide + 1}`} />{images.length > 1 && <div className="gallery-controls"><button className="site-button" aria-label="Previous image" onClick={() => setSlide((slide + images.length - 1) % images.length)}>←</button><p>{slide + 1} / {images.length}</p><button className="site-button" aria-label="Next image" onClick={() => setSlide((slide + 1) % images.length)}>→</button></div>}</div><p>{selected.description}</p>{selected.contribution && <><h3>My contribution</h3><p>{selected.contribution}</p></>}{selected.outcome && <section className="project-outcome"><h3>Impact</h3><p>{selected.outcome}</p></section>}<div className="skills-list">{selected.tech.map(skill => <span key={skill}>{skill}</span>)}</div>{selected.url && <a className="site-button project-link" href={selected.url} target="_blank" rel="noreferrer">Visit project ↗</a>}</article>;
  }
  return <article ref={page} className="site-page-content personal-content"><h1>Projects</h1><p>A selection of web applications, mobile apps, and tools I’ve worked on.</p><div className="project-grid">{projects.map(project => <button className="big-button-container project-card" key={project.id} onClick={() => { setSelected(project); setSlide(0); }}><img src={project.image} alt={project.imageAlt || `${project.name} project preview`} /><h3>{project.name}</h3><p>{project.description}</p><span>Open project →</span></button>)}</div></article>;
}
export function Contact() {
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [company, setCompany] = useState(''), [message, setMessage] = useState(''), [opened, setOpened] = useState(false);
  function submit(event) {
    event.preventDefault();
    const body = `${message.trim()}\n\nFrom: ${name.trim()}\nEmail: ${email.trim()}${company.trim() ? `\nCompany: ${company.trim()}` : ''}`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`Portfolio hello from ${name.trim()}`)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }
  return <article className="site-page-content personal-content"><div className="contact-header"><h1>Contact</h1><div className="contact-socials"><a className="big-button-container" aria-label="Jason’s GitHub" href={profile.github} target="_blank" rel="noreferrer"><img src="/os-assets/contact-gh.png" alt="GitHub" width="36" height="36" /></a><a className="big-button-container" aria-label="Jason’s LinkedIn" href={profile.linkedin} target="_blank" rel="noreferrer"><img src="/os-assets/contact-in.png" alt="LinkedIn" width="36" height="36" /></a></div></div><p>Have something in mind? I’d love to hear from you. Reach me by email or compose a message below.</p><p><b>Email: </b><a href={`mailto:${profile.email}`}>{profile.email}</a></p><form className="contact-form" onSubmit={submit}><label>Your name:<input required name="name" autoComplete="name" placeholder="Name" value={name} onChange={event => setName(event.target.value)} maxLength={100} /></label><label>Email:<input required type="email" name="email" autoComplete="email" placeholder="Email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} /></label><label>Company (optional):<input name="company" autoComplete="organization" placeholder="Company" value={company} onChange={event => setCompany(event.target.value)} maxLength={100} /></label><label>Message:<textarea required name="message" placeholder="Message" value={message} onChange={event => setMessage(event.target.value)} maxLength={4000} /></label><button className="site-button" type="submit">Compose email ↗</button><p className="contact-note" role="status">{opened ? 'Your email app was requested. Send your draft there, or use the email link above.' : 'Opens a draft in your email app. You send it from there.'}</p></form></article>;
}
