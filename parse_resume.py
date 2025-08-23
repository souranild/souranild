import re
import json
from collections import defaultdict

def clean_latex(text):
    """Remove or convert LaTeX commands to plain text."""
    text = re.sub(r'\\(bf|textit|italicitem|plainitem|&)', '', text)  # Remove formatting commands
    text = re.sub(r'\\href\{(.*?)\}\{(.*?)\}', r'\2 (\1)', text)  # Convert \href to plain text with link
    text = re.sub(r'\\[a-zA-Z]+', '', text)  # Remove any other LaTeX commands
    return text.strip()

def extract_sections(tex_content):
    sections = re.findall(r'\\begin{rSection}{(.*?)}(.*?)\\end{rSection}', tex_content, re.DOTALL)
    data = defaultdict(list)
    for section_name, section_body in sections:
        if section_name.lower() == "skills":
            skills = re.findall(r'\\entry{(.*?)}{(.*?)}', section_body)
            data['Skills'] = [{k: v} for k, v in skills]
        elif section_name.lower() == "education":
            edu = re.findall(r'\\begin{rSubsectionNoBullet}{(.*?)}{(.*?)}{(.*?)}{(.*?)}(.*?)\\end{rSubsectionNoBullet}', section_body, re.DOTALL)
            for name, inst, degree, years, details in edu:
                details_list = [clean_latex(d) for d in re.findall(r'\\italicitem{(.*?)}', details)]
                data['Education'].append({
                    "name": clean_latex(name),
                    "institution": clean_latex(inst),
                    "degree": clean_latex(degree),
                    "years": clean_latex(years),
                    "details": details_list
                })
        elif section_name.lower() == "experience":
            exp = re.findall(r'\\begin{rSubsection}{(.*?)}{(.*?)}{(.*?)}{(.*?)}(.*?)\\end{rSubsection}', section_body, re.DOTALL)
            for company, dates, title, location, details in exp:
                items = [clean_latex(item) for item in re.findall(r'\\item (.*)', details)]
                data['Experience'].append({
                    "company": clean_latex(company),
                    "dates": clean_latex(dates),
                    "title": clean_latex(title),
                    "location": clean_latex(location),
                    "details": items
                })
        elif section_name.lower() == "projects":
            projects = re.findall(r'\\begin{rSubsectionNoBullet}{(.*?)}{(.*?)}{(.*?)}{(.*?)}(.*?)\\end{rSubsectionNoBullet}', section_body, re.DOTALL)
            for name, dates, org, location, details in projects:
                items = [clean_latex(item) for item in re.findall(r'\\item{(.*?)}', details)]
                
                # Extract links from name if present
                link_match = re.search(r'\\href{(.*?)}{(.*?)}', name)
                if link_match:
                    link_url = link_match.group(1)
                    link_text = link_match.group(2)
                    clean_name = clean_latex(link_text)
                    project_link = link_url
                else:
                    clean_name = clean_latex(name)
                    project_link = None
                
                data['Projects'].append({
                    "name": clean_name,
                    "dates": clean_latex(dates),
                    "organization": clean_latex(org),
                    "location": clean_latex(location) if location.strip() else clean_latex(org),
                    "details": items,
                    "link": project_link
                })
        elif section_name.lower() == "publications":
            pubs = re.findall(r'\\begin{rSubsectionNoBullet}{(.*?)}{(.*?)}{(.*?)}{(.*?)}(.*?)\\end{rSubsectionNoBullet}', section_body, re.DOTALL)
            for title, date, journal, location, details in pubs:
                items = [clean_latex(item) for item in re.findall(r'\\plainitem{(.*?)}', details)]
                data['Publications'].append({
                    "title": clean_latex(title),
                    "date": clean_latex(date),
                    "journal": clean_latex(journal),
                    "location": clean_latex(location),
                    "details": items
                })
    return data

if __name__ == "__main__":
    with open("/workspaces/souranild/souranil.tex", "r") as f:
        tex_content = f.read()
    resume_data = extract_sections(tex_content)
    print(json.dumps(resume_data, indent=2))
