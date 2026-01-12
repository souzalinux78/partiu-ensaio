// Lista de instrumentos com suas categorias
export const instrumentos = [
  { nome: 'ACORDEON', categoria: 'TECLAS' },
  { nome: 'BARÍTONO DE PISTO', categoria: 'METAIS' },
  { nome: 'CLARINETE', categoria: 'MADEIRAS' },
  { nome: 'CLARINETE ALTO', categoria: 'MADEIRAS' },
  { nome: 'CLARINETE BAIXO', categoria: 'MADEIRAS' },
  { nome: 'CLARINETE CONTRA BAIXO', categoria: 'MADEIRAS' },
  { nome: 'CORNE INGLÊS', categoria: 'MADEIRAS' },
  { nome: 'CORNET', categoria: 'METAIS' },
  { nome: 'EUPHONIUM', categoria: 'METAIS' },
  { nome: 'FAGOTE', categoria: 'MADEIRAS' },
  { nome: 'FLAUTA', categoria: 'MADEIRAS' },
  { nome: 'FLAUTA BAIXO', categoria: 'MADEIRAS' },
  { nome: 'FLAUTA CONTRALTO', categoria: 'MADEIRAS' },
  { nome: 'FLUGELHORN', categoria: 'METAIS' },
  { nome: 'MELOFONE', categoria: 'METAIS' },
  { nome: 'OBOÉ', categoria: 'MADEIRAS' },
  { nome: 'OBOÉ D\'AMORE', categoria: 'MADEIRAS' },
  { nome: 'POCKET', categoria: 'METAIS' },
  { nome: 'SAX HORN', categoria: 'METAIS' },
  { nome: 'SAXOFONE ALTO', categoria: 'MADEIRAS' },
  { nome: 'SAXOFONE BAIXO', categoria: 'MADEIRAS' },
  { nome: 'SAXOFONE BARÍTONO', categoria: 'MADEIRAS' },
  { nome: 'SAXOFONE SOPRANINO C', categoria: 'MADEIRAS' },
  { nome: 'SAXOFONE SOPRANINO R', categoria: 'MADEIRAS' },
  { nome: 'SAXOFONE SOPRANO CUR', categoria: 'MADEIRAS' },
  { nome: 'SAXOFONE SOPRANO RET', categoria: 'MADEIRAS' },
  { nome: 'SAXOFONE TENOR', categoria: 'MADEIRAS' },
  { nome: 'TROMBONE', categoria: 'METAIS' },
  { nome: 'TROMBONITO', categoria: 'METAIS' },
  { nome: 'TROMPA', categoria: 'METAIS' },
  { nome: 'TROMPETE', categoria: 'METAIS' },
  { nome: 'TUBA', categoria: 'METAIS' },
  { nome: 'TUBA HELICON', categoria: 'METAIS' },
  { nome: 'TUBA WAGNERIANA', categoria: 'METAIS' },
  { nome: 'VIOLA', categoria: 'CORDAS' },
  { nome: 'VIOLINO', categoria: 'CORDAS' },
  { nome: 'VIOLINO CONTRALTO', categoria: 'CORDAS' },
  { nome: 'VIOLONCELO', categoria: 'CORDAS' },
];

// Função para obter a categoria de um instrumento
export const getCategoriaInstrumento = (nomeInstrumento) => {
  const instrumento = instrumentos.find(inst => inst.nome === nomeInstrumento);
  return instrumento ? instrumento.categoria : null;
};
