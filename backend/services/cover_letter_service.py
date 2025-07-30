import os
from typing import Optional
import httpx
from models import User
from services.cv_service import extract_text_from_cv

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your-groq-api-key")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

async def generate_cover_letter(
    job_description: str,
    company_name: str,
    language: str,
    user_profile: User,
    cv_content: Optional[str] = None
) -> str:
    """Generate a personalized cover letter using Groq API."""
    
    # Extract CV content if file path provided
    cv_text = ""
    if cv_content and os.path.exists(cv_content):
        cv_text = extract_text_from_cv(cv_content)
    
    # Build user context
    user_context = f"""
    User Profile:
    - Name: {user_profile.name}
    - Email: {user_profile.email}
    - Phone: {user_profile.phone or 'Not provided'}
    - GitHub: {user_profile.github_url or 'Not provided'}
    - LinkedIn: {user_profile.linkedin_url or 'Not provided'}
    - Portfolio: {user_profile.portfolio_url or 'Not provided'}
    """
    
    if cv_text:
        user_context += f"\n\nCV Content:\n{cv_text[:2000]}..."  # Limit CV content length
    
    # Create prompt based on language
    if language.lower() == "french":
        prompt = create_french_prompt(job_description, company_name, user_context)
    else:
        prompt = create_english_prompt(job_description, company_name, user_context)
    
    # Call Groq API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-70b-versatile",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert career counselor and writer who creates compelling, personalized cover letters that highlight relevant skills and experience for specific job opportunities."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"].strip()
            else:
                return generate_fallback_cover_letter(job_description, company_name, user_profile, language)
                
    except Exception as e:
        print(f"Error calling Groq API: {str(e)}")
        return generate_fallback_cover_letter(job_description, company_name, user_profile, language)

def create_english_prompt(job_description: str, company_name: str, user_context: str) -> str:
    """Create English prompt for cover letter generation."""
    return f"""
    Please write a professional cover letter in English for the following job opportunity:

    Company: {company_name}
    Job Description: {job_description}

    {user_context}

    Requirements:
    - Write in a professional, engaging tone
    - Highlight relevant skills and experience from the CV content
    - Show enthusiasm for the company and role
    - Keep it concise (3-4 paragraphs)
    - Include proper salutation and closing
    - Make it specific to this role and company
    - Do not include placeholder text like [Your Name] - use the actual name provided

    Generate the cover letter now:
    """

def create_french_prompt(job_description: str, company_name: str, user_context: str) -> str:
    """Create French prompt for cover letter generation."""
    return f"""
    Veuillez rédiger une lettre de motivation professionnelle en français pour l'opportunité d'emploi suivante:

    Entreprise: {company_name}
    Description du poste: {job_description}

    {user_context}

    Exigences:
    - Rédigez dans un ton professionnel et engageant
    - Mettez en valeur les compétences et expériences pertinentes du CV
    - Montrez de l'enthousiasme pour l'entreprise et le poste
    - Gardez-la concise (3-4 paragraphes)
    - Incluez une salutation et une formule de politesse appropriées
    - Rendez-la spécifique à ce poste et cette entreprise
    - N'incluez pas de texte de substitution comme [Votre Nom] - utilisez le nom réel fourni

    Générez la lettre de motivation maintenant:
    """

def generate_fallback_cover_letter(job_description: str, company_name: str, user_profile: User, language: str) -> str:
    """Generate a basic fallback cover letter if API fails."""
    
    if language.lower() == "french":
        return f"""
Madame, Monsieur,

Je vous écris pour exprimer mon vif intérêt pour l'opportunité de stage chez {company_name}. Votre annonce a particulièrement retenu mon attention car elle correspond parfaitement à mes aspirations professionnelles et à mon parcours académique.

Mon profil technique et mes expériences antérieures me permettent d'apporter une contribution significative à votre équipe. Je suis particulièrement motivé(e) par la mission de {company_name} et j'aimerais contribuer à vos projets innovants.

Je serais ravi(e) de discuter plus en détail de ma candidature lors d'un entretien. Vous pouvez me contacter à l'adresse {user_profile.email} ou par téléphone au {user_profile.phone or '[numéro à fournir]'}.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Cordialement,
{user_profile.name}
        """.strip()
    else:
        return f"""
Dear Hiring Manager,

I am writing to express my strong interest in the internship opportunity at {company_name}. Your job posting caught my attention as it aligns perfectly with my career aspirations and academic background.

My technical background and previous experiences enable me to make a meaningful contribution to your team. I am particularly motivated by {company_name}'s mission and would like to contribute to your innovative projects.

I would be delighted to discuss my application in more detail during an interview. You can contact me at {user_profile.email} or by phone at {user_profile.phone or '[phone number to be provided]'}.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
{user_profile.name}
        """.strip()