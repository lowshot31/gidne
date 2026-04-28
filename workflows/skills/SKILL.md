# Agent Skills Loader
name: skills

## Description
Load and execute specific skills or prompts from your local skills repository (`C:\Users\cisor\.agent\skills\skills`).

## How to Use
`/skills <skill_name>` 
?�시: `/skills typescript-expert`

## AI Instructions
1. When the user executes this workflow with a skill name, read the `README.md` file from `C:\Users\cisor\.agent\skills\skills\<skill_name>\README.md`.
2. If the skill is found, internalize all instructions/prompts inside the skill's markdown file, and immediately apply them to the user's current context or task.
3. If the user doesn't provide a skill name, or provides an invalid one, inform them the skill doesn't exist.
4. From the moment the skill is loaded, heavily adopt the persona, constraints, and rules defined in the loaded skill.
