import React, { useEffect, useState } from 'react'
import './Portfolio.css'

const navItems = [
  { label: 'Education', id: 'education' },
  { label: 'Experience', id: 'experience' },
  { label: 'Projects', id: 'projects' },
  { label: 'Publications', id: 'publications' },
  { label: 'Blogs', id: 'blogs' }
]

function Navbar() {
  return (
    <nav className="portfolio-nav">
      {navItems.map(item => (
        <a key={item.id} href={`#${item.id}`}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}

function CollapsibleItem({ title, meta, details, isExpanded, onToggle, className }) {
  return (
    <div className={`portfolio-item portfolio-box ${className || ''}`}>
      <div className="collapsible-header" onClick={onToggle}>
        <div>
          <div className="portfolio-item-title">{title}</div>
          <div className="portfolio-item-meta">{meta}</div>
        </div>
        <div className={`dropdown-arrow ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </div>
      </div>
      {isExpanded && (
        <ul className="portfolio-item-details">
          {details.map((detail, j) => (
            <li key={j}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="portfolio-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function App() {
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedEducation, setExpandedEducation] = useState({})
  const [expandedExperience, setExpandedExperience] = useState({})

  useEffect(() => {
    fetch('/resume.json')
      .then(res => res.json())
      .then(data => {
        setResume(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading resume:', err)
        setLoading(false)
      })
  }, [])

  const toggleEducation = (index) => {
    setExpandedEducation(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const toggleExperience = (index) => {
    setExpandedExperience(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  if (loading) {
    return (
      <div className="loading-container">
        Loading...
      </div>
    )
  }

  return (
    <div>
      <div className="portfolio-container">
        <header className="portfolio-header">
          <h1>Souranil Das</h1>
          <p>Design Verification Engineer • Software Developer • IoT Researcher</p>
        </header>

        <Navbar />

        <Section id="education" title="Education">
          <div className="timeline">
            {resume?.Education?.map((edu, i) => (
              <CollapsibleItem
                key={i}
                className="timeline-item"
                title={edu.degree}
                meta={`${edu.institution} • ${edu.years}`}
                details={edu.details}
                isExpanded={expandedEducation[i]}
                onToggle={() => toggleEducation(i)}
              />
            ))}
          </div>
        </Section>

        <Section id="experience" title="Experience">
          <div className="timeline">
            {resume?.Experience?.map((exp, i) => (
              <CollapsibleItem
                key={i}
                className="timeline-item"
                title={`${exp.title} @ ${exp.company}`}
                meta={`${exp.location} • ${exp.dates}`}
                details={exp.details}
                isExpanded={expandedExperience[i]}
                onToggle={() => toggleExperience(i)}
              />
            ))}
          </div>
        </Section>

        <Section id="projects" title="Projects">
          {resume?.Projects?.map((proj, i) => (
            <div key={i} className="portfolio-item portfolio-box">
              <div className="portfolio-item-title">
                {proj.link ? (
                  <a href={proj.link} target="_blank" rel="noopener noreferrer">
                    {proj.name} ↗
                  </a>
                ) : (
                  proj.name
                )}
              </div>
              <div className="portfolio-item-meta">
                {proj.organization} • {proj.dates}
              </div>
              <ul className="portfolio-item-details">
                {proj.details.map((detail, j) => (
                  <li key={j}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section id="publications" title="Publications">
          {resume?.Publications?.map((pub, i) => (
            <div key={i} className="portfolio-item portfolio-box">
              <div className="portfolio-item-title">
                {pub.link ? (
                  <a href={pub.link} target="_blank" rel="noopener noreferrer">
                    {pub.title} ↗
                  </a>
                ) : (
                  pub.title
                )}
              </div>
              <div className="portfolio-item-meta">
                {pub.journal} • {pub.date}
              </div>
              <ul className="portfolio-item-details">
                {pub.details.map((detail, j) => (
                  <li key={j}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section id="blogs" title="Blogs">
          {resume?.Blogs?.map((blog, i) => (
            <div key={i} className="portfolio-item portfolio-box">
              <div className="portfolio-item-title">
                {blog.link ? (
                  <a href={blog.link} target="_blank" rel="noopener noreferrer">
                    {blog.title} ↗
                  </a>
                ) : (
                  blog.title
                )}
              </div>
              <div className="portfolio-item-meta">
                {blog.platform} • {blog.date}
              </div>
              <div className="portfolio-item-details">
                <p>{blog.description}</p>
                {blog.tags && (
                  <div className="blog-tags">
                    {blog.tags.map((tag, j) => (
                      <span key={j} className="blog-tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  )
}

export default App