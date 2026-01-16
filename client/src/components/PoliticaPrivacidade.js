import React from 'react';
import './PoliticaPrivacidade.css';

const PoliticaPrivacidade = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="politica-modal-overlay" onClick={onClose}>
      <div className="politica-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="politica-modal-header">
          <h2>Política de Privacidade e Proteção de Dados Pessoais</h2>
          <button className="politica-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="politica-modal-body">
          <div className="politica-header-info">
            <p><strong>Partiu Ensaio</strong></p>
            <p>Última atualização: 01/2026</p>
          </div>

          <p>
            O Partiu Ensaio respeita a privacidade, a dignidade e a confiança de todos os usuários. 
            Esta plataforma foi desenvolvida com o propósito exclusivo de facilitar a organização e a 
            comunicação de ensaios musicais, de forma simples, colaborativa, responsável e transparente.
          </p>

          <p>
            Esta Política de Privacidade e Proteção de Dados tem por finalidade informar, de maneira 
            clara e acessível, como os dados pessoais são coletados, utilizados, armazenados e protegidos, 
            em conformidade com a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD), 
            sempre pautada pela boa-fé, pelo respeito às pessoas e pela responsabilidade no uso das informações.
          </p>

          <h3>1. Natureza do Projeto e Ausência de Vínculo Institucional</h3>
          <p>
            O Partiu Ensaio é um projeto independente, sem qualquer vínculo institucional, administrativo, 
            jurídico, organizacional ou representativo com igrejas, congregações, denominações religiosas 
            ou quaisquer outras instituições.
          </p>
          <p>
            A plataforma não representa, não substitui e não atua em nome de nenhuma entidade religiosa. 
            Seu uso ocorre de forma voluntária, por iniciativa dos próprios usuários, exclusivamente para 
            fins de organização de ensaios, não havendo qualquer associação formal ou institucional com terceiros.
          </p>

          <h3>2. Dados Pessoais Tratados</h3>
          <p>A plataforma poderá tratar apenas dados pessoais estritamente necessários para o seu funcionamento, tais como:</p>
          <ul>
            <li>Nome ou apelido informado pelo usuário</li>
            <li>Informações de contato, quando eventualmente disponibilizadas</li>
            <li>Informações relacionadas à organização de ensaios (datas, horários e locais definidos pelos próprios usuários)</li>
            <li>Dados técnicos e operacionais coletados automaticamente, como endereço IP, tipo de dispositivo e navegador, para fins de segurança e estabilidade da plataforma</li>
          </ul>
          <p>
            O Partiu Ensaio não realiza a coleta de dados pessoais sensíveis, nos termos do art. 5º, II, 
            da LGPD, nem de dados excessivos ou incompatíveis com suas finalidades.
          </p>

          <h3>3. Finalidade do Tratamento de Dados</h3>
          <p>Os dados pessoais são tratados exclusivamente para as seguintes finalidades:</p>
          <ul>
            <li>Permitir o funcionamento adequado da plataforma</li>
            <li>Facilitar a organização e comunicação entre os usuários</li>
            <li>Garantir a segurança, estabilidade e melhoria contínua do sistema</li>
            <li>Cumprir obrigações legais ou regulatórias, quando aplicável</li>
          </ul>
          <p>
            Em nenhuma hipótese os dados serão utilizados para fins comerciais, publicitários, mercadológicos 
            ou de exploração econômica.
          </p>

          <h3>4. Base Legal para o Tratamento</h3>
          <p>
            O tratamento de dados pessoais ocorre com fundamento nas bases legais previstas na LGPD, especialmente:
          </p>
          <ul>
            <li>Consentimento do titular, manifestado de forma livre e informada ao utilizar a plataforma</li>
            <li>Execução das funcionalidades solicitadas pelo próprio usuário</li>
            <li>Legítimo interesse, observado de maneira equilibrada, transparente e proporcional, sempre respeitando os direitos e as liberdades fundamentais dos titulares</li>
          </ul>

          <h3>5. Compartilhamento de Dados</h3>
          <p>O Partiu Ensaio não compartilha, comercializa ou vende dados pessoais a terceiros.</p>
          <p>O compartilhamento somente poderá ocorrer:</p>
          <ul>
            <li>Quando necessário para a operação técnica da plataforma, como serviços de hospedagem e infraestrutura, sempre com fornecedores que adotem medidas adequadas de segurança e proteção de dados</li>
            <li>Quando houver obrigação legal ou determinação de autoridade competente</li>
          </ul>

          <h3>6. Armazenamento e Segurança da Informação</h3>
          <p>
            Os dados pessoais são armazenados em ambiente digital seguro, com adoção de medidas técnicas 
            e organizacionais razoáveis, compatíveis com a natureza das informações tratadas, visando prevenir:
          </p>
          <ul>
            <li>Acessos não autorizados</li>
            <li>Perdas, alterações ou divulgações indevidas</li>
            <li>Uso inadequado ou ilícito dos dados</li>
          </ul>
          <p>
            Embora nenhum sistema seja absolutamente imune a riscos, o Partiu Ensaio se compromete a atuar 
            com diligência, responsabilidade e boa-fé na proteção das informações confiadas.
          </p>

          <h3>7. Direitos dos Titulares de Dados</h3>
          <p>Nos termos da LGPD, os titulares de dados pessoais poderão, a qualquer momento, solicitar:</p>
          <ul>
            <li>Confirmação da existência de tratamento de dados</li>
            <li>Acesso aos dados pessoais tratados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Exclusão de dados, quando aplicável</li>
            <li>Informações sobre o uso e o tratamento de seus dados</li>
          </ul>
          <p>
            As solicitações serão analisadas com seriedade, transparência e dentro dos prazos legalmente estabelecidos.
          </p>

          <h3>8. Princípios Éticos e Boa-fé</h3>
          <p>
            O Partiu Ensaio é um projeto construído com base em valores de respeito mútuo, responsabilidade, 
            colaboração e boa-fé. O tratamento de dados pessoais observa os princípios da finalidade, adequação, 
            necessidade, transparência e segurança, sempre com atenção à dignidade da pessoa humana.
          </p>

          <h3>9. Atualizações desta Política</h3>
          <p>
            Esta Política de Privacidade poderá ser atualizada a qualquer tempo, visando aprimoramentos, 
            adequações legais ou evolução da plataforma. Recomenda-se que o usuário consulte este documento periodicamente.
          </p>

          <h3>10. Encarregado pelo Tratamento de Dados Pessoais (DPO)</h3>
          <p>
            Em conformidade com o art. 41 da Lei Geral de Proteção de Dados Pessoais (LGPD), o Partiu Ensaio 
            indica um Encarregado pelo Tratamento de Dados Pessoais (DPO), responsável por atuar como canal 
            de comunicação entre os titulares de dados, a plataforma e a Autoridade Nacional de Proteção de 
            Dados (ANPD).
          </p>
          <p>
            O Encarregado tem como atribuições orientar quanto às práticas de proteção de dados, receber 
            solicitações dos titulares e zelar pelo tratamento ético, transparente e responsável das informações pessoais.
          </p>
          <p>
            <strong>Canal de contato do Encarregado (DPO):</strong>
          </p>
          <p>
            📧 E-mail: [INSERIR E-MAIL DO DPO OU CANAL DE CONTATO OFICIAL]
          </p>
          <p>
            Por meio deste canal, o titular poderá encaminhar dúvidas, solicitações, reclamações ou exercer 
            seus direitos previstos na LGPD.
          </p>

          <div className="politica-footer">
            <p><strong>Partiu Ensaio</strong></p>
            <p>Organização, respeito e responsabilidade.</p>
          </div>
        </div>
        <div className="politica-modal-footer">
          <button className="btn-primary" onClick={onClose}>Entendi</button>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
