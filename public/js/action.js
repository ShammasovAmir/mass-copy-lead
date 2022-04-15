/**
 *  Добавление кнопки создания сделок
 */
$(document.body).on('click', 'button.button-input.button-input-with-menu', () =>
  massCreateLeads.drawButton()
);

/**
 *  Добавление функционала при нажатии на кнопку создания сделок
 */
$(document.body).on('click', '[data-type="copy_leads"]', () => {
  if (
    AMOCRM.data.current_entity === 'leads' ||
    AMOCRM.data.current_entity === 'leads-pipeline'
  )
    massCreateLeads.run();
});

/**
 *  При выборе "Только для текущей страницы"
 */
$(document.body).on('click', '#__only_for_current_page__', async () => {
  // Получить данные выбранных сделок
  if (!massCreateLeads.isCreateOnlyForCurrentPageButtonLoading) {
    massCreateLeads.isCreateOnlyForCurrentPageButtonLoading = true;
    $('#__only_for_current_page__').addClass(
      'mass-select-notification-modal__btn--loading'
    );
    massCreateLeads.selectedLeads = await massCreateLeads.getManyLeadsByIDs(
      massCreateLeads.selectedLeadsIDs
    );

    await (async () => {
      $('.mass-select-notification-modal').each(function () {
        $(this).remove();
      });
      massCreateLeads.isCreateOnlyForCurrentPageButtonLoading = false;

      // Render
      massCreateLeads.renderPopup(
        massCreateLeads.users,
        massCreateLeads.pipelines
      );
    })();
  }
});

/**
 *  При выборе "Для активного фильтра"
 */
$(document.body).on('click', '#__for_active_filter__', async () => {
  if (!massCreateLeads.isCreateForActiveFilterButtonLoading) {
    massCreateLeads.isCreateForActiveFilterButtonLoading = true;
    $('#__for_active_filter__').addClass(
      'mass-select-notification-modal__btn--loading'
    );
    // Получить данные выбранных сделок по активному фильтру
    // Getting
    massCreateLeads.selectedLeads = await massCreateLeads.getLeadsWithFilters();
    // --------------------

    await (async () => {
      $('.mass-select-notification-modal').each(function () {
        $(this).remove();
      });
      massCreateLeads.isCreateForActiveFilterButtonLoading = false;

      // Render
      massCreateLeads.renderPopup(
        massCreateLeads.users,
        massCreateLeads.pipelines
      );
    })();
  }
});

/**
 *  Закрытие всплывающего окна при нажатии на крестик
 */
$(document.body).on('click', '.copy-many-leads-modal__close-btn', () => {
  $(document.body).css({
    overflow: 'visible',
  });
  $('.copy-many-leads-modal').each(function () {
    $(this).remove();
  });
});

/**
 *  Делаем чекбокс динамичным
 */
$(document.body).on('click', '.copy-many-leads-modal__checkbox', () => {
  if (massCreateLeads.usersCheckboxActive === false) {
    $(
      '#__manager-form-group .copy-many-leads-modal__form-group-label .copy-many-leads-modal__error'
    ).removeClass('copy-many-leads-modal__error--active');
    $('#manager-select-box .copy-many-leads-modal__selected').removeClass(
      'copy-many-leads-modal__selected--error'
    );
    $('.copy-many-leads-modal__checkbox').addClass(
      'copy-many-leads-modal__checkbox--active'
    );
    $('#manager-select-box .copy-many-leads-modal__selected').addClass(
      'copy-many-leads-modal__selected--disabled'
    );
    $('#manager-select-box .copy-many-leads-modal__selected span').html(
      'Not selected'
    );
    $(
      '#manager-select-box .copy-many-leads-modal__selected input[name="manager-select-box"]'
    ).val('');

    massCreateLeads.usersCheckboxActive = true;
  } else if (massCreateLeads.usersCheckboxActive === true) {
    $('.copy-many-leads-modal__checkbox').removeClass(
      'copy-many-leads-modal__checkbox--active'
    );
    $('#manager-select-box .copy-many-leads-modal__selected').removeClass(
      'copy-many-leads-modal__selected--disabled'
    );

    massCreateLeads.usersCheckboxActive = false;
  }
});

/**
 *  Убрать ошибки при выборе input или select
 */
$(document.body).on(
  'click',
  '#manager-select-box .copy-many-leads-modal__selected',
  () => {
    $('#manager-select-box .copy-many-leads-modal__selected').removeClass(
      'copy-many-leads-modal__selected--error'
    );
    $(
      '#__manager-form-group .copy-many-leads-modal__form-group-label .copy-many-leads-modal__error'
    ).removeClass('copy-many-leads-modal__error--active');
  }
);
$(document.body).on(
  'click',
  '#status-select-box .copy-many-leads-modal__selected',
  () => {
    $('#status-select-box .copy-many-leads-modal__selected').removeClass(
      'copy-many-leads-modal__selected--error'
    );
    $(
      '#__status-form-group .copy-many-leads-modal__form-group-label .copy-many-leads-modal__error'
    ).removeClass('copy-many-leads-modal__error--active');
  }
);
$(document.body).on('focus', 'input[name="prefix-input"]', function () {
  $(this).removeClass('form-group__input--error');
  $(
    '#__prefix-form-group .copy-many-leads-modal__form-group-label .copy-many-leads-modal__error'
  ).removeClass('copy-many-leads-modal__error--active');
});

/**
 *  Показать tooltip
 */
$(document.body).on(
  {
    mouseenter: () => {
      let tooltip = $('.copy-many-leads-modal__tooltip');
      tooltip.addClass('copy-many-leads-modal__tooltip--active');
      tooltip.html(`The prefix will be added to the left of the lead name.`);
      tooltip.css({
        top: '52%',
      });
    },
    mouseleave: () => {
      $('.copy-many-leads-modal__tooltip').removeClass(
        'copy-many-leads-modal__tooltip--active'
      );
    },
  },
  '#__prefix-info-btn'
);
$(document.body).on(
  {
    mouseenter: () => {
      let tooltip = $('.copy-many-leads-modal__tooltip');
      tooltip.addClass('copy-many-leads-modal__tooltip--active');
      tooltip.html(
        ` To add multiple tags, write tag names separated by commas.`
      );
      tooltip.css({
        top: '61%',
      });
    },
    mouseleave: () => {
      $('.copy-many-leads-modal__tooltip').removeClass(
        'copy-many-leads-modal__tooltip--active'
      );
    },
  },
  '#__tag-info-btn'
);

/**
 *  Создать сделки при отправке формы
 */
$(document.body).on('submit', '#copy_many_leads_form', async (e) => {
  e.preventDefault();
  if (massCreateLeads.isCreateLeadsButtonLoading === false)
    await massCreateLeads.getAndValidateFormData(massCreateLeads.selectedLeads);
});

/**
 *  Убрать всплывающее уведомление при закрытии или нажатии кнопки "Продолжить работу"
 */
$(document.body).on(
  'click',
  '.creation-completed-notification__close-btn',
  function () {
    massCreateLeads.removeNotification();
  }
);
$(document.body).on(
  'click',
  '.creation-completed-notification__btn',
  function () {
    massCreateLeads.removeNotification();
    location.reload();
  }
);

/**
 *  Убрать всплывающее уведомление выбора множества сделок при закрытии
 */
$(document.body).on(
  'click',
  '.mass-select-notification-modal__close-btn',
  function () {
    $(document.body).css({
      overflow: 'visible',
    });
    $('.mass-select-notification-modal').each(function () {
      $(this).remove();
    });
  }
);
