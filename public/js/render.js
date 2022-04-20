/**
 *  Перед отрисовкой элемента
 */
massCreateLeads.prerender = () => {
  $(document.body).css({
    overflow: 'hidden',
  });
};

/**
 *  Добавление всплывающего окна
 */
massCreateLeads.renderPopup = (users, pipelines) => {
  massCreateLeads.widget.render({
    // href: '/view/popup.twig', // PRODUCTION
    href: '/widget/view/popup.twig', // DEVELOPMENT
    // base_path: massCreateLeads.widget.params.path, // PRODUCTION
    base_path: massCreateLeads.sourceUrl, // DEVELOPMENT
    load: function (template) {
      let popup = template.render({ users: users, pipelines: pipelines });
      massCreateLeads.prerender();
      $(popup).appendTo('#page_holder');
      // Активировать выпадающие списки
      massCreateLeads.animateSelectDropdown('manager-select-box');
      massCreateLeads.animateSelectDropdown('status-select-box');
    },
  });
};

/**
 *  Добавление кнопки
 */
massCreateLeads.drawButton = () => {
  massCreateLeads.widget.render({
    // href: '/view/copy_button.twig', // PRODUCTION
    href: '/widget/view/copy_button.twig', // DEVELOPMENT
    // base_path: massCreateLeads.widget.params.path, // PRODUCTION
    base_path: massCreateLeads.sourceUrl, // DEVELOPMENT
    load: function (template) {
      let copyButton = template.render();
      if (!$('[data-type="copy_leads"]').length)
        if (
          AMOCRM.data.current_entity === 'leads-pipeline' ||
          AMOCRM.data.current_entity === 'leads'
        )
          $('.button-input__context-menu.context-menu-pipeline').append(
            copyButton
          );
    },
  });
};

/**
 *  Добавление уведомления "Продолжить работу"
 */
massCreateLeads.drawNotification = () => {
  massCreateLeads.widget.render({
    // href: '/view/created_notification.twig', // PRODUCTION
    href: '/widget/view/created_notification.twig', // DEVELOPMENT
    // base_path: massCreateLeads.widget.params.path, // PRODUCTION
    base_path: massCreateLeads.sourceUrl, // DEVELOPMENT
    load: function (template) {
      let notification = template.render();
      massCreateLeads.prerender();
      $(notification).appendTo('#page_holder');
    },
  });
};

/**
 *  Добавление уведомления при массовом выборе
 */
massCreateLeads.drawMassSelectNotification = () => {
  massCreateLeads.widget.render({
    // href: '/view/mass_select_notification.twig', // PRODUCTION
    href: '/widget/view/mass_select_notification.twig', // DEVELOPMENT
    // base_path: massCreateLeads.widget.params.path, // PRODUCTION
    base_path: massCreateLeads.sourceUrl, // DEVELOPMENT
    load: function (template) {
      let notification = template.render();
      massCreateLeads.prerender();
      $(notification).appendTo('#page_holder');
    },
  });
};
