export function generateCoverLetterContent({ profile, jobDescription, companyName, positionTitle, language, tone }: {
  profile: any;
  jobDescription: string;
  companyName: string;
  positionTitle: string;
  language: string;
  tone: string;
}) {
  const today = new Date().toLocaleDateString(language === 'french' ? 'fr-FR' : 'en-US');
  
  if (language === 'french') {
    return generateFrenchCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today });
  } else {
    return generateEnglishCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today });
  }
}

function generateEnglishCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today }: any) {
  const greeting = tone === 'enthusiastic' ? 'Dear Hiring Team,' : 'Dear Hiring Manager,';
  const intro = tone === 'enthusiastic' 
    ? `I am thrilled to express my strong interest in the ${positionTitle} position at ${companyName}.`
    : tone === 'confident'
    ? `I am writing to apply for the ${positionTitle} position at ${companyName}, confident that my background makes me an ideal candidate.`
    : `I am writing to express my interest in the ${positionTitle} position at ${companyName}.`;
    
  const skills = extractSkillsFromJobDescription(jobDescription);
  const closing = tone === 'enthusiastic'
    ? 'I would be absolutely delighted to discuss how my passion and skills can contribute to your team\'s success.'
    : 'I would welcome the opportunity to discuss how my experience aligns with your needs.';

  return `${today}

${greeting}

${intro} As a ${profile.title || 'dedicated professional'} with ${profile.experience || 'relevant experience'}, I am excited about the opportunity to contribute to your team.

${generateBodyParagraph(profile, skills, companyName, tone)}

${profile.skills ? `My technical skills include ${profile.skills}, which I believe align well with the requirements outlined in your job posting.` : ''}

${profile.education ? `I hold a ${profile.education} and have continuously sought to expand my knowledge through various projects and learning opportunities.` : ''}

${closing}

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
${profile.name || 'Your Name'}
${profile.email || ''}
${profile.phone || ''}`;
}

function generateFrenchCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today }: any) {
  const greeting = 'Madame, Monsieur,';
  const intro = tone === 'enthusiastic'
    ? `C'est avec un grand enthousiasme que je vous présente ma candidature pour le poste de ${positionTitle} au sein de ${companyName}.`
    : tone === 'confident'
    ? `Je me permets de vous adresser ma candidature pour le poste de ${positionTitle} chez ${companyName}, convaincu(e) que mon profil correspond parfaitement à vos attentes.`
    : `Je vous écris pour postuler au poste de ${positionTitle} chez ${companyName}.`;

  const skills = extractSkillsFromJobDescription(jobDescription);
  const closing = tone === 'enthusiastic'
    ? 'Je serais ravi(e) de pouvoir discuter de ma candidature et de ma motivation lors d\'un entretien.'
    : 'Je reste à votre disposition pour tout complément d\'information et espère avoir l\'opportunité de vous rencontrer.';

  return `${today}

${greeting}

${intro} En tant que ${profile.title || 'professionnel(le) motivé(e)'} avec ${profile.experience || 'une expérience pertinente'}, je suis convaincu(e) de pouvoir apporter une réelle valeur ajoutée à votre équipe.

${generateBodyParagraphFrench(profile, skills, companyName, tone)}

${profile.skills ? `Mes compétences techniques incluent ${profile.skills}, qui correspondent bien aux exigences mentionnées dans votre offre d'emploi.` : ''}

${profile.education ? `Titulaire d'un ${profile.education}, j'ai continuellement cherché à enrichir mes connaissances à travers divers projets et opportunités d'apprentissage.` : ''}

${closing}

Je vous remercie de l'attention que vous porterez à ma candidature.

Cordialement,
${profile.name || 'Votre Nom'}
${profile.email || ''}
${profile.phone || ''}`;
}

function extractSkillsFromJobDescription(jobDescription: string): string[] {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Git', 'Agile', 'Scrum', 'Machine Learning', 'Data Analysis', 'Project Management',
    'Communication', 'Leadership', 'Problem Solving', 'Team Collaboration'
  ];
  
  return commonSkills.filter(skill => 
    jobDescription.toLowerCase().includes(skill.toLowerCase())
  ).slice(0, 5);
}

function generateBodyParagraph(profile: any, skills: string[], companyName: string, tone: string): string {
  const enthusiasm = tone === 'enthusiastic' ? ' I am particularly excited about ' : ' I am interested in ';
  
  let paragraph = `During my career, I have developed strong expertise in ${skills.length > 0 ? skills.join(', ') : 'relevant technologies'} which directly relates to this position.`;
  
  if (profile.projects) {
    paragraph += ` I have successfully worked on projects involving ${profile.projects}, demonstrating my ability to deliver results.`;
  }
  
  paragraph += `${enthusiasm}${companyName}'s mission and the opportunity to contribute to innovative projects.`;
  
  return paragraph;
}

function generateBodyParagraphFrench(profile: any, skills: string[], companyName: string, tone: string): string {
  const enthusiasm = tone === 'enthusiastic' ? ' Je suis particulièrement enthousiaste à l\'idée de ' : ' Je suis intéressé(e) par ';
  
  let paragraph = `Au cours de ma carrière, j'ai développé une solide expertise en ${skills.length > 0 ? skills.join(', ') : 'technologies pertinentes'}, compétences directement liées à ce poste.`;
  
  if (profile.projects) {
    paragraph += ` J'ai travaillé avec succès sur des projets impliquant ${profile.projects}, démontrant ma capacité à livrer des résultats.`;
  }
  
  paragraph += `${enthusiasm}contribuer à la mission de ${companyName} et aux projets innovants de l'entreprise.`;
  
  return paragraph;
}