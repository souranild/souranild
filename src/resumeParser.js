// LaTeX Resume Parser for Souranil Das Portfolio Workstation

export const FALLBACK_RESUME = {
    name: "SOURANIL DAS",
    title: "Design Verification Engineer @ NXP Semiconductors",
    contact: "Bangalore, India | souranil.das.2024@gmail.com",
    experience: [
        {
            role: "Design Verification (DV) Engineer",
            company: "NXP Semiconductors",
            location: "Bangalore, India",
            date: "Jan 2024 - Present",
            bullets: [
                "Verify complex System-on-Chips (SoCs) and digital logic IPs.",
                "Construct functional simulation verification testbenches utilizing SystemVerilog and Universal Verification Methodology (UVM).",
                "Set up stimulus drivers, functional coverage blocks, and registers validation checkers.",
                "Drive functional coverage closure, analyzing RTL code and simulation assertions."
            ]
        }
    ],
    education: [
        {
            degree: "B.Tech in Electronics & Communication Engineering (ECE)",
            school: "VIT Chennai",
            location: "Chennai, India",
            date: "2020 - 2024",
            bullets: [
                "Specializations: VLSI circuit layout design, Computer Architecture, Embedded Networks.",
                "Student researcher investigating IoT cloud systems, smart telemetry, and embedded programming interfaces."
            ]
        }
    ],
    projects: [
        {
            name: "AI-Enabled Hydroponics Cultivation System",
            tags: "Azure IoT Hub, Databricks, Predictive AI, Hardware-Software Co-Design",
            description: "An automated IoT vertical farming design optimized for cultivation of medicinal crop yields. Configured hardware sensory nodes reporting EC, pH, water temperatures, and air metrics directly to Azure IoT Hub. Data feeds were processed in Databricks where regression models adjusted lighting schedules and nutrient dosings automatically based on crop phase."
        },
        {
            name: "SMADE - Smart Medical Assist Device",
            tags: "IoT Telemetry, Embedded Systems, Microcontrollers",
            description: "An elderly-healthcare assistive IoT capsule. Automates medication dispensing cycles, sound reminders, and channels real-time patient vitals telemetry streams to a web-based portal."
        },
        {
            name: "async-cse Python Library",
            tags: "Python, asyncio, API Wrapper, Open Source",
            description: "An asynchronous Python wrapper library interface querying the Google Custom Search JSON API. Engineered on top of asyncio to handle queries and return formatted JSON arrays."
        }
    ],
    publications: [
        {
            title: "Revolutionizing Holy-Basil Cultivation with AI-Enabled Hydroponics System",
            publisher: "ResearchGate Publication (2023)",
            summary: "An IoT vertical agriculture sensor framework feeding water temperature, pH, and nutrient records directly to cloud databases, utilizing AI regression inside Azure Databricks to automatically optimize lighting arrays and dosage timelines."
        },
        {
            title: "SMADE - Smart Medical Assist Device for Elders",
            publisher: "Conference Proceedings (2022)",
            summary: "Implementation details of an IoT medication alarm and pill dispenser system transmitting remote vitals telemetry records to secure web portal databases."
        }
    ],
    skills: {
        languages: "SystemVerilog, Verilog, C/C++, Python, Shell (bash/zsh), HTML/CSS, JavaScript",
        frameworks: "UVM, ASIC/FPGA design flow, RTL Synthesis, Azure IoT, Databricks",
        tools: "Cadence Xcelium, Verisium Debug, VS Code, Git, LibreOffice, LaTeX"
    }
};

// Clean helper to remove LaTeX commands and return clean HTML/text
function cleanLatex(str) {
    if (!str) return '';
    return str
        .replace(/%.*$/gm, '') // Strip comments
        .replace(/\\textbf\s*\{([^}]*)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\s*\{([^}]*)\}/g, '<em>$1</em>')
        .replace(/\\href\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '<a href="$1" target="_blank">$2</a>')
        .replace(/\\href\s*\{([^}]*)\}/g, '<a href="$1" target="_blank">$1</a>')
        .replace(/\\url\s*\{([^}]*)\}/g, '<a href="$1" target="_blank">$1</a>')
        .replace(/\\small/g, '')
        .replace(/\\large/g, '')
        .replace(/\\Huge/g, '')
        .replace(/\\huge/g, '')
        .replace(/\\bf/g, '')
        .replace(/\\it/g, '')
        .replace(/\\hfill/g, ' ')
        .replace(/\\\\/g, '<br>')
        .replace(/\\par/g, '<br>')
        .replace(/\\item/g, '')
        .replace(/\\&/g, '&')
        .replace(/\\\$/g, '$')
        .replace(/\\%/g, '%')
        .replace(/\\_/g, '_')
        .replace(/\\\{/g, '{')
        .replace(/\\\}/g, '}')
        .replace(/\{/g, '')
        .replace(/\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Extract skill categories from technical skills section
function extractSkill(content, categoryName) {
    // Regex for \resumeSubItem{CategoryName}{value} or \textbf{CategoryName}{: value}
    const regex1 = new RegExp(`(?:\\\\resumeSubItem|\\\\textbf)\\s*\\{\\s*${categoryName}\\s*\\}\\s*\\{(?:\\s*:\\s*)?([^}]+)\\}`, 'i');
    const match1 = content.match(regex1);
    if (match1) return match1[1].trim();

    // Regex for \textbf{CategoryName}: value or CategoryName: value
    const regex2 = new RegExp(`(?:\\\\textbf\\s*\\{\\s*${categoryName}\\s*\\}|${categoryName})\\s*(?:\\{?\\s*:\\s*|\\s+)([^}\\\\\\n]+)`, 'i');
    const match2 = content.match(regex2);
    if (match2) return match2[1].trim();

    return '';
}

// LaTeX string parser
export function parseLaTeXString(tex) {
    if (!tex || tex.trim() === '') {
        return FALLBACK_RESUME;
    }

    // Clean up basic LaTeX comments
    const cleanTex = tex.split('\n')
        .map(line => line.replace(/%.*$/, ''))
        .join('\n');

    // Parse Name (e.g. \centerline{\Huge \bf Souranil Das} or \Huge\textbf{Souranil Das})
    let name = "SOURANIL DAS";
    const nameMatch = cleanTex.match(/\\centerline\s*\{\s*\\Huge\s*\\bf\s*([^}]+)\}/i) || 
                      cleanTex.match(/\\Huge\s*\\textbf\s*\{\s*([^}]+)\}/i) ||
                      cleanTex.match(/\\Huge\s*\{\s*\\bf\s*([^}]+)\}/i);
    if (nameMatch) {
        name = nameMatch[1].trim().toUpperCase();
    }

    // Parse sections
    const sections = {};
    const sectionRegex = /\\section\s*\{([^}]+)\}([\s\S]*?)(?=\\section\s*\{|$)/gi;
    let match;
    
    while ((match = sectionRegex.exec(cleanTex)) !== null) {
        const sectionName = match[1].trim().toLowerCase();
        const sectionContent = match[2];
        sections[sectionName] = sectionContent;
    }

    const resumeData = {
        name,
        title: FALLBACK_RESUME.title,
        contact: FALLBACK_RESUME.contact,
        experience: [],
        education: [],
        projects: [],
        publications: [],
        skills: { ...FALLBACK_RESUME.skills }
    };

    // Helper to find sections dynamically using substring match
    const findSection = (keys) => {
        const foundKey = Object.keys(sections).find(k => keys.some(key => k.includes(key)));
        return foundKey ? sections[foundKey] : null;
    };

    // 1. Parse Contact Info
    const emailMatch = cleanTex.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
        resumeData.contact = `Bangalore, India | ${emailMatch[1]}`;
    }

    // 2. Parse Experience Section
    const expContent = findSection(['experience', 'work', 'employment', 'history']);
    if (expContent) {
        resumeData.experience = parseJobOrEdItems(expContent);
    } else {
        resumeData.experience = FALLBACK_RESUME.experience;
    }

    // 3. Parse Education Section
    const edContent = findSection(['education', 'academic', 'qualification']);
    if (edContent) {
        resumeData.education = parseJobOrEdItems(edContent);
    } else {
        resumeData.education = FALLBACK_RESUME.education;
    }

    // 4. Parse Projects Section
    const projContent = findSection(['project']);
    if (projContent) {
        resumeData.projects = parseProjectItems(projContent);
    } else {
        resumeData.projects = FALLBACK_RESUME.projects;
    }

    // 5. Parse Publications / Research Section
    const pubContent = findSection(['publication', 'research', 'paper']);
    if (pubContent) {
        resumeData.publications = parsePublicationItems(pubContent);
    } else {
        resumeData.publications = FALLBACK_RESUME.publications;
    }

    // 6. Parse Skills Section
    const skillsContent = findSection(['skills', 'technical skills', 'skills summary', 'abilities']);
    if (skillsContent) {
        const languages = extractSkill(skillsContent, 'Languages');
        const frameworks = extractSkill(skillsContent, 'Frameworks') || 
                           extractSkill(skillsContent, 'Technologies') || 
                           extractSkill(skillsContent, 'Technical Skills');
        const tools = extractSkill(skillsContent, 'Tools') || 
                      extractSkill(skillsContent, 'Developer Tools') || 
                      extractSkill(skillsContent, 'Software');
                      
        if (languages) resumeData.skills.languages = cleanLatex(languages);
        if (frameworks) resumeData.skills.frameworks = cleanLatex(frameworks);
        if (tools) resumeData.skills.tools = cleanLatex(tools);
    }

    // Setup the title dynamically based on the first experience entry
    if (resumeData.experience && resumeData.experience.length > 0) {
        const latestJob = resumeData.experience[0];
        resumeData.title = `${latestJob.role} @ ${latestJob.company}`;
    }

    return resumeData;
}


// Main parser function
export async function getResumeData() {
    try {
        const response = await fetch('/resume.tex');
        if (!response.ok) {
            console.warn("Could not load resume.tex, falling back to static data.");
            return FALLBACK_RESUME;
        }
        const tex = await response.text();
        return parseLaTeXString(tex);
    } catch (e) {
        console.error("Error parsing resume.tex, falling back to static data:", e);
        return FALLBACK_RESUME;
    }
}

// Sub-parsers for sections
function parseJobOrEdItems(content) {
    const items = [];
    
    // Check if using standard resumeSubheading command
    const subheadingRegex = /\\resumeSubheading\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/g;
    let subMatch;
    const subheadingBlocks = [];
    
    while ((subMatch = subheadingRegex.exec(content)) !== null) {
        subheadingBlocks.push({
            company: subMatch[1].trim(),
            location: subMatch[2].trim(),
            role: subMatch[3].trim(),
            date: subMatch[4].trim(),
            index: subMatch.index,
            endIndex: subheadingRegex.lastIndex
        });
    }

    if (subheadingBlocks.length > 0) {
        for (let i = 0; i < subheadingBlocks.length; i++) {
            const block = subheadingBlocks[i];
            const nextBlockStart = (i + 1 < subheadingBlocks.length) ? subheadingBlocks[i+1].index : content.length;
            const subContent = content.substring(block.endIndex, nextBlockStart);
            
            const bullets = [];
            const itemRegex = /\\item\s*([\s\S]*?)(?=\\item|\\end|\\resume|$)/g;
            let itemMatch;
            while ((itemMatch = itemRegex.exec(subContent)) !== null) {
                const bulletText = itemMatch[1].trim();
                if (bulletText) {
                    bullets.push(cleanLatex(bulletText));
                }
            }

            items.push({
                role: cleanLatex(block.role),
                company: cleanLatex(block.company),
                location: cleanLatex(block.location),
                date: cleanLatex(block.date),
                bullets: bullets.length > 0 ? bullets : ["TBD details..."]
            });
        }
    } else {
        const lines = content.split('\n');
        let currentItem = null;
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            if (line.includes('\\resumeSubheading') || line.includes('\\subsection') || (line.includes('\\textbf') && line.includes('\\hfill'))) {
                if (currentItem) items.push(currentItem);
                
                const parts = line.split('\\hfill');
                let leftText = cleanLatex(parts[0] || '');
                let rightText = cleanLatex(parts[1] || '');
                
                currentItem = {
                    role: leftText,
                    company: "Organization",
                    location: "",
                    date: rightText,
                    bullets: []
                };
            } else if (line.startsWith('\\item') || line.startsWith('-')) {
                if (currentItem) {
                    const bullet = cleanLatex(line.replace(/^\\item/, '').replace(/^-/, ''));
                    if (bullet) currentItem.bullets.push(bullet);
                }
            } else {
                const cleaned = cleanLatex(line);
                if (cleaned) {
                    if (currentItem) {
                        currentItem.bullets.push(cleaned);
                    } else {
                        currentItem = {
                            role: cleaned,
                            company: "Info",
                            location: "",
                            date: "",
                            bullets: []
                        };
                    }
                }
            }
        }
        if (currentItem) items.push(currentItem);
    }
    
    return items.length > 0 ? items : FALLBACK_RESUME.experience;
}

function extractBracedArguments(str, startIndex = 0) {
    const args = [];
    let i = startIndex;
    while (i < str.length && args.length < 2) {
        const openIdx = str.indexOf('{', i);
        if (openIdx === -1) break;
        
        let depth = 1;
        let closeIdx = openIdx + 1;
        while (closeIdx < str.length && depth > 0) {
            if (str[closeIdx] === '{') depth++;
            else if (str[closeIdx] === '}') depth--;
            closeIdx++;
        }
        if (depth === 0) {
            args.push(str.substring(openIdx + 1, closeIdx - 1));
            i = closeIdx;
        } else {
            break;
        }
    }
    return { args, endIndex: i };
}

function parseProjectItems(content) {
    const projects = [];
    
    // Try parsing \resumeSubItem
    let searchIndex = 0;
    while (true) {
        const subItemIdx = content.indexOf('\\resumeSubItem', searchIndex);
        if (subItemIdx === -1) break;
        
        const { args, endIndex } = extractBracedArguments(content, subItemIdx + 14);
        if (args.length === 2) {
            const rawTitle = args[0];
            const rawDesc = args[1];
            
            let name = rawTitle;
            let tags = 'Development';
            
            const tagsMatch = rawTitle.match(/\(([^)]+)\)\s*$/);
            if (tagsMatch) {
                tags = tagsMatch[1].trim();
                name = rawTitle.substring(0, tagsMatch.index).trim();
            }
            
            projects.push({
                name: cleanLatex(name),
                tags: cleanLatex(tags),
                description: cleanLatex(rawDesc)
            });
            searchIndex = endIndex;
        } else {
            searchIndex = subItemIdx + 14;
        }
    }
    
    if (projects.length > 0) {
        return projects;
    }
    
    const projectHeadingRegex = /\\resumeProjectHeading\s*\{([^}]*)\}\s*\{([^}]*)\}/g;
    let projMatch;
    const projBlocks = [];
    
    while ((projMatch = projectHeadingRegex.exec(content)) !== null) {
        projBlocks.push({
            name: projMatch[1].trim(),
            tags: projMatch[2].trim(),
            index: projMatch.index,
            endIndex: projectHeadingRegex.lastIndex
        });
    }

    if (projBlocks.length > 0) {
        for (let i = 0; i < projBlocks.length; i++) {
            const block = projBlocks[i];
            const nextBlockStart = (i + 1 < projBlocks.length) ? projBlocks[i+1].index : content.length;
            const subContent = content.substring(block.endIndex, nextBlockStart);
            
            const bullets = [];
            const itemRegex = /\\item\s*([\s\S]*?)(?=\\item|\\end|\\resume|$)/g;
            let itemMatch;
            while ((itemMatch = itemRegex.exec(subContent)) !== null) {
                const bulletText = itemMatch[1].trim();
                if (bulletText) bullets.push(cleanLatex(bulletText));
            }
            
            projects.push({
                name: cleanLatex(block.name),
                tags: cleanLatex(block.tags),
                description: bullets.join(' ') || "Project details to follow..."
            });
        }
    } else {
        const lines = content.split('\n');
        let currentProj = null;
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            if (line.includes('\\textbf') && (line.includes('|') || line.includes('\\hfill'))) {
                if (currentProj) projects.push(currentProj);
                
                const parts = line.split(/[|]|\\hfill/);
                currentProj = {
                    name: cleanLatex(parts[0] || ''),
                    tags: cleanLatex(parts[1] || 'Embedded Systems, ASIC'),
                    description: ''
                };
            } else if (line.startsWith('\\item') || line.startsWith('-')) {
                if (currentProj) {
                    const desc = cleanLatex(line.replace(/^\\item/, '').replace(/^-/, ''));
                    currentProj.description += (currentProj.description ? ' ' : '') + desc;
                }
            } else {
                const cleaned = cleanLatex(line);
                if (cleaned) {
                    if (currentProj) {
                        currentProj.description += (currentProj.description ? ' ' : '') + cleaned;
                    } else {
                        currentProj = {
                            name: cleaned,
                            tags: "Development",
                            description: ""
                        };
                    }
                }
            }
        }
        if (currentProj) projects.push(currentProj);
    }
    
    return projects.length > 0 ? projects : FALLBACK_RESUME.projects;
}

function parsePublicationItems(content) {
    const publications = [];
    const itemRegex = /\\item\s*([\s\S]*?)(?=\\item|$)/g;
    let match;
    
    while ((match = itemRegex.exec(content)) !== null) {
        const itemText = match[1].trim();
        if (!itemText) continue;
        
        let title = '';
        const titleMatch = itemText.match(/\\textbf\s*\{([^}]*)\}/) || itemText.match(/"([^"]*)"/) || itemText.match(/`([^`]*)'/);
        if (titleMatch) {
            title = cleanLatex(titleMatch[1]);
        } else {
            title = cleanLatex(itemText.split(',')[0] || 'Research Paper');
        }
        
        let publisher = 'Conference/Journal';
        const pubMatch = itemText.match(/\\textit\s*\{([^}]*)\}/) || itemText.match(/in\s+([^\n,]*)/i);
        if (pubMatch) {
            publisher = cleanLatex(pubMatch[1]);
        }
        
        const summary = cleanLatex(itemText.replace(/\\textbf\s*\{[^}]*\}/, '').replace(/\\textit\s*\{[^}]*\}/, '').trim());
        
        publications.push({
            title,
            publisher,
            summary: summary || "Implementation and verification research findings."
        });
    }
    
    return publications.length > 0 ? publications : FALLBACK_RESUME.publications;
}
