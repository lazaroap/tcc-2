const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, 'seed-data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log('Limpando banco de dados...');
  await prisma.notification.deleteMany();
  await prisma.groupInvite.deleteMany();
  await prisma.requestReply.deleteMany();
  await prisma.recommendationRequest.deleteMany();
  await prisma.recommendationComment.deleteMany();
  await prisma.recommendationVote.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  console.log('Inserindo usuarios...');
  await prisma.user.createMany({ data: data.users });
  console.log(`  ${data.users.length} usuarios`);

  console.log('Inserindo prestadores...');
  await prisma.provider.createMany({ data: data.providers });
  console.log(`  ${data.providers.length} prestadores`);

  console.log('Inserindo grupos...');
  await prisma.group.createMany({ data: data.groups });
  console.log(`  ${data.groups.length} grupos`);

  console.log('Inserindo membros...');
  await prisma.groupMember.createMany({ data: data.groupMembers });
  console.log(`  ${data.groupMembers.length} membros`);

  console.log('Inserindo reviews...');
  await prisma.review.createMany({ data: data.reviews });
  console.log(`  ${data.reviews.length} reviews`);

  console.log('Inserindo recomendacoes...');
  await prisma.recommendation.createMany({ data: data.recommendations });
  console.log(`  ${data.recommendations.length} recomendacoes`);

  console.log('\nSeed concluido! Todos os dados foram carregados do seed-data.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
