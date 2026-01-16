import React from 'react';
import './PoliticaPrivacidade.css';

const TermoUso = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="politica-modal-overlay" onClick={onClose}>
      <div className="politica-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="politica-modal-header">
          <h2>Termo de Uso</h2>
          <button className="politica-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="politica-modal-body">
          <div className="politica-header-info">
            <p><strong>Partiu Ensaio</strong></p>
            <p>Última atualização: 01/2026</p>
          </div>

          <p>
            O presente Termo de Uso estabelece as condições para utilização da plataforma Partiu Ensaio, 
            disponível por meio de site e/ou aplicativo, destinada à organização e comunicação de ensaios 
            musicais, de forma colaborativa e voluntária.
          </p>

          <p>
            Ao acessar ou utilizar a plataforma, o usuário declara que leu, compreendeu e concorda 
            integralmente com as disposições deste Termo.
          </p>

          <h3>1. Natureza da Plataforma</h3>
          <p>
            O Partiu Ensaio é um projeto independente, de caráter organizacional e informativo, criado 
            para auxiliar grupos e pessoas na gestão de datas, horários e informações relacionadas a 
            ensaios musicais.
          </p>
          <p>
            A plataforma não possui vínculo institucional, administrativo, jurídico ou representativo 
            com igrejas, congregações, denominações religiosas ou quaisquer outras instituições, não 
            atuando em nome de terceiros, nem representando entidades de qualquer natureza.
          </p>

          <h3>2. Elegibilidade e Uso da Plataforma</h3>
          <p>A utilização do Partiu Ensaio é livre e voluntária, sendo de responsabilidade do usuário:</p>
          <ul>
            <li>Fornecer informações verdadeiras e adequadas</li>
            <li>Utilizar a plataforma de forma ética, respeitosa e responsável</li>
            <li>Não empregar a ferramenta para fins ilícitos, ofensivos ou incompatíveis com sua finalidade</li>
          </ul>
          <p>
            O usuário se compromete a não utilizar a plataforma para fins comerciais, políticos, 
            institucionais ou promocionais sem autorização expressa do responsável pelo projeto.
          </p>

          <h3>3. Responsabilidades do Usuário</h3>
          <p>Ao utilizar o Partiu Ensaio, o usuário concorda que:</p>
          <ul>
            <li>É o único responsável pelas informações que inserir na plataforma</li>
            <li>Deve respeitar a boa convivência, o respeito mútuo e a finalidade do sistema</li>
            <li>Não deverá inserir conteúdos ofensivos, discriminatórios, ilícitos ou que violem direitos de terceiros</li>
            <li>Não deverá tentar acessar áreas restritas, sistemas internos ou dados de outros usuários</li>
          </ul>
          <p>
            Qualquer uso indevido poderá resultar em suspensão ou bloqueio de acesso, sem prejuízo de 
            medidas cabíveis.
          </p>

          <h3>4. Limitação de Responsabilidade</h3>
          <p>O Partiu Ensaio atua como ferramenta de apoio organizacional, não se responsabilizando por:</p>
          <ul>
            <li>Decisões tomadas pelos usuários com base nas informações inseridas</li>
            <li>Cancelamentos, alterações ou falhas na realização de ensaios</li>
            <li>Conteúdos inseridos pelos próprios usuários</li>
            <li>Eventuais indisponibilidades técnicas temporárias da plataforma</li>
          </ul>
          <p>
            A plataforma não garante funcionamento ininterrupto, embora adote esforços razoáveis para 
            sua estabilidade e segurança.
          </p>

          <h3>5. Propriedade Intelectual</h3>
          <p>
            Todo o conteúdo, estrutura, layout, identidade visual e código do Partiu Ensaio são 
            protegidos pela legislação aplicável, sendo vedada a reprodução, modificação ou distribuição 
            sem autorização expressa do responsável pelo projeto.
          </p>

          <h3>6. Privacidade e Proteção de Dados</h3>
          <p>
            O tratamento de dados pessoais realizado pela plataforma é regido pela Política de 
            Privacidade e Proteção de Dados Pessoais, documento separado e complementar a este Termo de Uso.
          </p>
          <p>
            Ao utilizar a plataforma, o usuário declara estar ciente e de acordo com a Política de 
            Privacidade vigente.
          </p>

          <h3>7. Suspensão ou Encerramento do Acesso</h3>
          <p>O Partiu Ensaio reserva-se o direito de suspender ou encerrar o acesso de usuários que:</p>
          <ul>
            <li>Descumprirem este Termo de Uso</li>
            <li>Utilizarem a plataforma de forma indevida ou contrária à sua finalidade</li>
            <li>Praticarem atos que comprometam a segurança, integridade ou bom funcionamento do sistema</li>
          </ul>
          <p>
            Sempre que possível, tais medidas serão adotadas de forma proporcional e responsável.
          </p>

          <h3>8. Alterações do Termo de Uso</h3>
          <p>
            Este Termo de Uso poderá ser alterado a qualquer tempo, visando melhorias, ajustes 
            operacionais ou adequações legais. Recomenda-se que o usuário consulte periodicamente 
            este documento.
          </p>

          <h3>9. Legislação Aplicável</h3>
          <p>
            Este Termo de Uso é regido pelas leis da República Federativa do Brasil, especialmente 
            pelo Código Civil e pela Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).
          </p>

          <h3>10. Canal de Contato</h3>
          <p>
            Para dúvidas, esclarecimentos ou solicitações relacionadas a este Termo de Uso, o usuário 
            poderá entrar em contato por meio do canal disponibilizado na própria plataforma.
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

export default TermoUso;
