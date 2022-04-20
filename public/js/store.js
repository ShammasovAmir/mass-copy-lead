// Переменные состояния
massCreateLeads.usersCheckboxActive = false;
massCreateLeads.isCreateLeadsButtonLoading = false;
massCreateLeads.isCreateOnlyForCurrentPageButtonLoading = false;
massCreateLeads.isCreateForActiveFilterButtonLoading = false;

massCreateLeads.selectedLeadsIDs = [];
massCreateLeads.users = [];
massCreateLeads.pipelines = [];
massCreateLeads.selectedLeads = [];

/**
 *  Функция получения id выбранных сделок
 */
massCreateLeads.getSelectedLeadIDs = () => {
  let selectedLeadID,
    selectedLeadsIDs = [];

  if (AMOCRM.data.current_entity === 'leads-pipeline')
    $(
      '.pipeline_leads__item.pipeline_leads__item_selected input[type="checkbox"]'
    ).each(function () {
      selectedLeadID = $(this).val();
      selectedLeadsIDs.push(selectedLeadID);
    });
  if (AMOCRM.data.current_entity === 'leads') {
    if ($('.control-checkbox.is-checked input#list_all_checker').length) {
      $(
        '.list-row__cell.js-list-row__cell .content-table__item__inner .control-checkbox .control-checkbox__body input[type="checkbox"]'
      ).each(function () {
        selectedLeadID = $(this).val();
        selectedLeadsIDs.push(selectedLeadID);
      });
    } else {
      $(
        '.list-row__cell.js-list-row__cell .content-table__item__inner .control-checkbox.is-checked .control-checkbox__body input[type="checkbox"]'
      ).each(function () {
        if ($(this).is(':checked')) {
          selectedLeadID = $(this).val();
          selectedLeadsIDs.push(selectedLeadID);
        }
      });
    }
  }

  return selectedLeadsIDs;
};

/**
 *  Функция преобразования даты в формат Unix timestamp
 */
massCreateLeads.convertDateToUnixTimestamp = (date) =>
  Math.floor(date.getTime() / 1000);

/**
 *  Функция получения и фильтрования встроенной константы менеджеров
 */
massCreateLeads.filterUsersConstant = async () => {
  let users = [],
    unfilteredUsers = Object.entries(AMOCRM.constant('managers'));

  unfilteredUsers.forEach((user) =>
    user[1].active ? users.push(user[1]) : null
  );

  return users;
};

/**
 *  GET-запрос воронок
 */
massCreateLeads.getPipelines = async () => {
  try {
    let pipelines = [],
      response = await fetch('/api/v4/leads/pipelines'),
      data = await response.json();
    // console.log('Before: ', data);
    data._embedded.pipelines.forEach((pipeline) =>
      !pipeline.is_archive ? pipelines.push(pipeline) : null
    );
    return pipelines;
  } catch (error) {
    console.error('===== ERROR in pipelines: ', error);
    return [];
  }
};

/**
 *  Функция получения следующей даты
 */
massCreateLeads.getNextDateString = (dateString) => {
  let dateArray = dateString.split('.')

  if (dateArray.length === 3) {
    let [day, month, year] = dateArray

    let oldDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    let newDate = new Date(oldDate)

    newDate.setDate(oldDate.getDate() + 2)

    let [yearString, monthString, dayString] = (newDate.toISOString())
      .slice(0, 10)
      .split('-')

    return `${dayString}.${monthString}.${yearString}`
  } else return dateString
}

/**
 *  Функция составления фильтра даты
 */
massCreateLeads.createDateFilterString = (dateString) =>
  `filter[${dateString}][from]=${massCreateLeads.convertDateToUnixTimestamp(
    new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
  )}&filter[${dateString}][to]=${massCreateLeads.convertDateToUnixTimestamp(
    new Date()
  )}&`;

/**
 *  Функция составления URL запроса сделок в активном фильтре
 */
massCreateLeads.createActiveFilterLeadsRequestUrl = () => {
  let requestQuery = '/api/v4/leads?limit=250&with=contacts&';

  if (AMOCRM.data.current_view.search !== undefined) {
    let filterValues = Object.entries(
      AMOCRM.data.current_view.search.filter.filter_values
    );

    // console.log('Filters!');
    // console.log(filterValues);
    for (let i = 0; i < filterValues.length; i++) {
      const filterKeyValuePair = filterValues[i];

      if (filterKeyValuePair[0].slice(0, 12) === 'filter[pipe]') {
        let keyLength = filterKeyValuePair[0].length,
          pipelineID = filterKeyValuePair[0]
            .slice(0, keyLength - 3)
            .slice(-(keyLength - 16));

        if (filterKeyValuePair[1].length === 1)
          requestQuery += `filter[statuses][0][pipeline_id]=${pipelineID}&filter[statuses][0][status_id]=${filterKeyValuePair[1][0]}&`;
        else requestQuery += `filter[pipeline_id][0]=${pipelineID}&`;

        // console.log('STATUS');
      } else if (filterKeyValuePair[0].slice(0, 17) === 'filter[main_user]')
        filterKeyValuePair[1].forEach(
          (managerID) =>
            (requestQuery += `filter[responsible_user_id][]=${managerID}&`)
        );
      else if (filterKeyValuePair[0].slice(0, 18) === 'filter[created_by]')
        filterKeyValuePair[1].forEach(
          (managerID) => (requestQuery += `filter[created_by][]=${managerID}&`)
        );
      else if (filterKeyValuePair[0].slice(0, 19) === 'filter[modified_by]')
        filterKeyValuePair[1].forEach(
          (managerID) => (requestQuery += `filter[updated_by][]=${managerID}&`)
        );
      else if (filterKeyValuePair[0].slice(0, 19) === 'filter[price][from]')
        requestQuery += `filter[price][from]=${filterKeyValuePair[1]}&`;
      else if (filterKeyValuePair[0].slice(0, 17) === 'filter[price][to]')
        requestQuery += `filter[price][to]=${filterKeyValuePair[1]}&`;
      else if (filterKeyValuePair[0].slice(0, 12) === 'filter[name]')
        requestQuery += `filter[name][0]=${filterKeyValuePair[1]}&`;
      else if (filterKeyValuePair[0].slice(0, 10) === 'filter[cf]') {
        let keyLength = filterKeyValuePair[0].length,
          fieldID;

        if (filterKeyValuePair[0][keyLength - 2] === 'm') {
          fieldID = filterKeyValuePair[0]
            .slice(0, keyLength - 7)
            .slice(-(keyLength - 18));

          requestQuery += `filter[custom_fields_values][${fieldID}][from]=${filterKeyValuePair[1]}&`;
        } else if (filterKeyValuePair[0][keyLength - 2] === 'o') {
          fieldID = filterKeyValuePair[0]
            .slice(0, keyLength - 5)
            .slice(-(keyLength - 16));

          requestQuery += `filter[custom_fields_values][${fieldID}][to]=${filterKeyValuePair[1]}&`;
        } else {
          fieldID =
            filterKeyValuePair[0][keyLength - 2] === '['
              ? filterKeyValuePair[0]
                .slice(0, keyLength - 3)
                .slice(-(keyLength - 14))
              : filterKeyValuePair[0]
                .slice(0, keyLength - 1)
                .slice(-(keyLength - 12));

          if (typeof filterKeyValuePair[1] === 'object')
            filterKeyValuePair[1].forEach(
              (filedValue) =>
                (requestQuery += `filter[custom_fields_values][${fieldID}][]=${filedValue}&`)
            );
          else if (typeof filterKeyValuePair[1] === 'string')
            requestQuery += `filter[custom_fields_values][${fieldID}][0]=${filterKeyValuePair[1]}&`;
        }
      } else if (filterKeyValuePair[0] === 'filter_date_to') {
        if (
          filterValues[i - 1][0] !== undefined &&
          filterValues[i - 1][0] === 'filter_date_from'
        ) {
          if (
            filterValues[i + 1] !== undefined &&
            filterValues[i + 1][0] === 'filter_date_switch' &&
            filterValues[i + 1][1] === 'created'
          )
            requestQuery += `filter[created_at][from]=${
              filterValues[i - 1][1]
            }&filter[created_at][to]=${
              massCreateLeads.getNextDateString(filterKeyValuePair[1])
            }&`;
          else if (
            filterValues[i + 1] !== undefined &&
            filterValues[i + 1][0] === 'filter_date_switch' &&
            filterValues[i + 1][1] === 'closed'
          )
            requestQuery += `filter[closed_at][from]=${
              filterValues[i - 1][1]
            }&filter[closed_at][to]=${
              massCreateLeads.getNextDateString(filterKeyValuePair[1])
            }&`;
          else if (
            filterValues[i - 1] !== undefined &&
            filterValues[i + 1][0] !== 'filter_date_switch' &&
            filterValues[i - 2] !== undefined &&
            filterValues[i - 2][0] !== 'filter_date_switch'
          )
            requestQuery += `filter[created_at][from]=${
              filterValues[i - 1][1]
            }&filter[created_at][to]=${
              massCreateLeads.getNextDateString(filterKeyValuePair[1])
            }&`;
        }
      } else if (filterKeyValuePair[0] === 'filter_date_switch') {
        if (
          filterValues[i + 1] !== undefined &&
          filterValues[i + 1][0] === 'filter_date_from' &&
          filterValues[i + 2] !== undefined &&
          filterValues[i + 2][0] === 'filter_date_to' &&
          filterKeyValuePair[1] === 'closed'
        )
          requestQuery += `filter[closed_at][from]=${
            filterValues[i + 1][1]
          }&filter[closed_at][to]=${
            massCreateLeads.getNextDateString(filterValues[i + 2][1])
          }&`;
      } else if (filterKeyValuePair[0] === 'filter[date_preset]') {
        if (
          filterValues[i + 1][0] !== undefined &&
          filterValues[i + 1][0] === 'filter_date_switch' &&
          filterValues[i + 1][1] === 'created'
        ) {
          switch (filterKeyValuePair[1]) {
            case 'today':
              let dateString =
                massCreateLeads.createDateFilterString('created_at');
              requestQuery += dateString;
              break;

            default:
              break;
          }
        } else if (
          filterValues[i + 1][0] === 'filter_date_switch' &&
          filterValues[i + 1][1] === 'closed'
        ) {
          switch (filterKeyValuePair[1]) {
            case 'today':
              let dateString =
                massCreateLeads.createDateFilterString('closed_at');
              requestQuery += dateString;
              break;

            default:
              break;
          }
        } else {
          switch (filterKeyValuePair[1]) {
            case 'today':
              let dateString =
                massCreateLeads.createDateFilterString('created_at');
              requestQuery += dateString;
              break;

            default:
              break;
          }
        }
      }
    }
  }

  console.log('ACTIVE_FILTER_REQUEST ', `${requestQuery}page=`);
  return `${requestQuery}page=`;
  // '/api/v4/leads?limit=250&with=contacts&page=';
};

/**
 *  Функция составления URL запроса нескольких сделок
 */
massCreateLeads.createManyLeadsRequestUrl = (leadIDs) => {
  // console.log(leadIDs.length);
  let requestQuery = '/api/v4/leads?';
  leadIDs.forEach((leadID) => (requestQuery += `filter[id][]=${leadID}&`));
  return requestQuery + 'limit=250&with=contacts';
};

/**
 *  GET-запрос нескольких сделок по ID
 */
massCreateLeads.getManyLeadsByIDs = async (leadIDs) => {
  let request = massCreateLeads.createManyLeadsRequestUrl(leadIDs);
  // console.log('Request Query: ', request);

  try {
    let response = await fetch(request),
      data = await response.json();
    // console.log(data);
    return data._embedded.leads;
  } catch (error) {
    console.error('===== ERROR while trying to fetch a lead: ', error);
  }
};

/**
 *  GET-запрос сделок в активном фильтре
 */
massCreateLeads.getLeadsWithFilters = async () => {
  let request = massCreateLeads.createActiveFilterLeadsRequestUrl(),
    leads = [];

  for (let i = 1; i > 0; i++) {
    try {
      let response = await fetch(`${request}${i}`);
      // console.log(response);
      if (response.status === 200) {
        let data = await response.json();
        leads = leads.concat(data._embedded.leads);
      } else break;
    } catch (error) {
      console.error('===== ERROR while trying to fetch a lead: ', error);
      break;
    }
  }

  console.log('All leads', leads);
  return leads;
};

/**
 *  Функция поиска в выпадающем списке
 */
massCreateLeads.searchOptions = (searchTerm, optionsList) => {
  // console.log('Searching!');
  searchTerm = searchTerm.toLowerCase();
  optionsList.forEach((option) => {
    let label =
      option.firstElementChild.nextElementSibling.innerText.toLowerCase();

    label.indexOf(searchTerm) !== -1
      ? (option.style.display = 'block')
      : (option.style.display = 'none');
  });
};

/**
 *  Функция делающая выпадающие списки динамичными
 */
massCreateLeads.animateSelectDropdown = (selectId) => {
  const selectBox = document.getElementById(selectId);
  const selected = selectBox.querySelector('.copy-many-leads-modal__selected');
  const optionsContainer = selectBox.querySelector(
    '.copy-many-leads-modal__options-container'
  );
  let selectInput = document.querySelector(`input[name="${selectId}"]`);
  let optionsSearchInput = selectBox.querySelector(
    'input[name="options_search_box"]'
  );
  const optionsList = selectBox.querySelectorAll(
    '.copy-many-leads-modal__option#option-selectable'
  );

  selected.addEventListener('click', () => {
    if (
      !selected.classList.contains('copy-many-leads-modal__selected--disabled')
    ) {
      optionsContainer.classList.toggle(
        'copy-many-leads-modal__options-container--active'
      );

      if (optionsSearchInput !== null || optionsSearchInput !== undefined) {
        optionsSearchInput.value = '';
        massCreateLeads.searchOptions('', optionsList);

        if (
          optionsContainer.classList.contains(
            'copy-many-leads-modal__options-container--active'
          )
        )
          optionsSearchInput.focus();
      }
    }
  });

  optionsList.forEach((option) =>
    option.addEventListener('click', () => {
      selected.querySelector('span').innerHTML =
        option.querySelector('label').innerHTML;
      selectInput.value = option.dataset.id;
      optionsContainer.classList.remove(
        'copy-many-leads-modal__options-container--active'
      );
    })
  );

  if (optionsSearchInput !== null || optionsSearchInput !== undefined) {
    optionsSearchInput.addEventListener('keyup', (e) => {
      massCreateLeads.searchOptions(e.target.value, optionsList);
    });
  }

  document.addEventListener('click', (e) => {
    let isOptionsContainer = optionsContainer.contains(e.target);
    let isSelected = selected.contains(e.target);

    if (optionsSearchInput !== null || optionsSearchInput !== undefined) {
      let isOptionsSearchInput = optionsSearchInput.contains(e.target);

      if (!isOptionsContainer && !isSelected && !isOptionsSearchInput)
        optionsContainer.classList.remove(
          'copy-many-leads-modal__options-container--active'
        );
    } else {
      if (!isOptionsContainer && !isSelected)
        optionsContainer.classList.remove(
          'copy-many-leads-modal__options-container--active'
        );
    }
  });
};

/**
 *  Функция, убирающая всплывающее уведомление
 */
massCreateLeads.removeNotification = () => {
  $(document.body).css({
    overflow: 'visible',
  });
  $('.creation-completed-notification').each(function () {
    $(this).remove();
  });
};

/**
 *  Функция валидации и получения данных с формы
 */
massCreateLeads.getAndValidateFormData = async (leadsData) => {

  console.log('leadsData2344234')
  console.log(leadsData)


  let managerName, statusID, leadName, tags;
  // Check if the checkbox is selected and if no get the manager data from input
  if ($('.copy-many-leads-modal__checkbox.copy-many-leads-modal__checkbox--active').length)
    managerName = '~%current%manager%~';
  else {
    managerName = $('input[name="manager-select-box"]').val();
  }

  // Get lead status and name input value
  statusID = $('input[name="status-select-box"]').val();
  leadName = $('input[name="prefix-input"]').val();

  let tagString = $('input[name="tags"]').val();

  if (tags !== '') {
    tags = [];
    const tagsNameArray = tagString.split(',');
    tagsNameArray.forEach((tagName) => tags.push({name: tagName}));
  } else tags = [];

  // Validate all the inputs and send data
  if (managerName === '') {
    $(
      '#__manager-form-group .copy-many-leads-modal__form-group-label .copy-many-leads-modal__error'
    ).addClass('copy-many-leads-modal__error--active');
    $('#manager-select-box .copy-many-leads-modal__selected').addClass(
      'copy-many-leads-modal__selected--error'
    );
  }

  if (statusID === '') {
    $(
      '#__status-form-group .copy-many-leads-modal__form-group-label .copy-many-leads-modal__error'
    ).addClass('copy-many-leads-modal__error--active');
    $('#status-select-box .copy-many-leads-modal__selected').addClass(
      'copy-many-leads-modal__selected--error'
    );
  }

  if (leadName === '') {
    $(
      '#__prefix-form-group .copy-many-leads-modal__form-group-label .copy-many-leads-modal__error'
    ).addClass('copy-many-leads-modal__error--active');
    $(
      '#__prefix-form-group .form-group__prefix-container .form-group__input-container input#modal-form-input'
    ).addClass('form-group__input--error');
  }

  if (managerName !== '' && statusID !== '' && leadName !== '') {
    // console.log('Leads data length', leadsData.length);
    $('button.copy-many-leads-modal__button').addClass(
      'copy-many-leads-modal__button--loading'
    );
    massCreateLeads.isCreateLeadsButtonLoading = true;

    massCreateLeads.leadsMatch = []

    /*This Errors*/
    for (let i = 0; i < leadsData.length; i += 40) {
      const leadsDataChunk = leadsData.slice(i, i + 40);

      await massCreateLeads.postManyLeads(
        leadsDataChunk,
        managerName,
        statusID,
        leadName,
        tags
      )
      console.log('massCreateLeads.leadsMatch')
      console.log(massCreateLeads.leadsMatch)


      let fieldDataArray = await massCreateLeads.prepareRequestData();

      console.log('Data Array:', fieldDataArray)

      await (async () => {
        await massCreateLeads.addCustomFields(fieldDataArray)
        massCreateLeads.leadsMatch = []
      })();
    }

    await (async () => {
      $('.copy-many-leads-modal').each(function () {
        $(this).remove();
      });
      $('button.copy-many-leads-modal__button').removeClass(
        'copy-many-leads-modal__button--loading'
      );
      massCreateLeads.isCreateLeadsButtonLoading = false;
      massCreateLeads.drawNotification();
    })();
  }
};

/**
 *  Функция подготовки данных сделок к POST-запросу
 */
massCreateLeads.prepareLeadsData = (
  leadsData,
  managerName,
  statusID,
  leadName,
  tags
) => {
  let preparedLeadsData = [],
    preparedLeadData;

  for (let i = 0; i < leadsData.length; i++) {
    let leadData = leadsData[i];

    preparedLeadData = {
      name: `${leadName} ${leadData.name}`,
      price: leadData.price,
      status_id: parseInt(statusID),
      responsible_user_id:
        managerName === '~%current%manager%~'
          ? leadData.responsible_user_id
          : parseInt(managerName),
      _embedded: {
        companies: leadData._embedded.companies,
        contacts:
          leadData._embedded.contacts.length > 0
            ? [leadData._embedded.contacts[0]]
            : leadData._embedded.contacts,
        tags:
          tags.length === 0
            ? leadData._embedded.tags
            : leadData._embedded.tags === null
            ? tags
            : [...leadData._embedded.tags, ...tags],
      },
    };
    preparedLeadsData.push(preparedLeadData);
  }
  console.log('Prepared data!');
  console.log(preparedLeadsData);
  return preparedLeadsData;
};

/**
 *  POST-запрос создания сделок
 */
massCreateLeads.postManyLeads = async (
  leadsData,
  managerName,
  statusID,
  leadName,
  tags
) => {
  const filteredLeadsData = massCreateLeads.prepareLeadsData(
    leadsData,
    managerName,
    statusID,
    leadName,
    tags
  );

  try {
    let response = await fetch('/api/v4/leads/complex', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(filteredLeadsData),
    });
    let data = await response.json();

    data.forEach((createdLeadData, i) => massCreateLeads.leadsMatch.push({
      newLeadID: createdLeadData.id,
      leadData: leadsData[i]
    }))

    console.log('============ Comparison', massCreateLeads.leadsMatch)

    console.log('========== 1!')

    await setTimeout(() => null, 300)
    return data;
  } catch (error) {
    console.error('===== ERROR while trying to post leads: ', error);
  }
};

/**
 *  Функция подготовки данных полей к PATCH-запросу
 */
massCreateLeads.prepareRequestData = async () => {
  let dataArray = [];

  for (let i = 0; i < massCreateLeads.leadsMatch.length; i++) {
    let filteredCustomFieldValues = [];

    if (
      massCreateLeads.leadsMatch[i].leadData !== null &&
      typeof massCreateLeads.leadsMatch[i].leadData !== undefined &&
      massCreateLeads.leadsMatch[i].leadData.custom_fields_values !== null &&
      typeof massCreateLeads.leadsMatch[i].leadData.custom_fields_values !== undefined
    ) {
      console.log('In Loop!')

      let unfilteredCustomFieldValues = massCreateLeads.leadsMatch[i].leadData.custom_fields_values;

      for (let i = 0; i < unfilteredCustomFieldValues.length; i++) {
        let unfilteredCustomFieldValuesArray =
            unfilteredCustomFieldValues[i].values,
          filteredCustomFieldValue,
          filteredCustomFieldValuesArray = [];

        if (
          unfilteredCustomFieldValues[i].field_type == 'text' ||
          unfilteredCustomFieldValues[i].field_type == 'numeric' ||
          unfilteredCustomFieldValues[i].field_type == 'checkbox' ||
          unfilteredCustomFieldValues[i].field_type == 'select' ||
          unfilteredCustomFieldValues[i].field_type == 'multiselect' ||
          unfilteredCustomFieldValues[i].field_type == 'date' ||
          unfilteredCustomFieldValues[i].field_type == 'url' ||
          unfilteredCustomFieldValues[i].field_type == 'textarea' ||
          unfilteredCustomFieldValues[i].field_type == 'radiobutton' ||
          unfilteredCustomFieldValues[i].field_type == 'category' ||
          unfilteredCustomFieldValues[i].field_type == 'birthday' ||
          unfilteredCustomFieldValues[i].field_type == 'date_time' ||
          unfilteredCustomFieldValues[i].field_type == 'price'
        ) {
          for (let i = 0; i < unfilteredCustomFieldValuesArray.length; i++) {
            let unfilteredCustomFieldValuesArrayElement = {
              value: unfilteredCustomFieldValuesArray[i].value,
            };

            filteredCustomFieldValuesArray.push(
              unfilteredCustomFieldValuesArrayElement
            );
          }

          if (filteredCustomFieldValuesArray.length > 0) {
            filteredCustomFieldValue = {
              field_code: unfilteredCustomFieldValues[i].field_code,
              field_id: unfilteredCustomFieldValues[i].field_id,
              field_name: unfilteredCustomFieldValues[i].field_name,
              field_type: unfilteredCustomFieldValues[i].field_type,
              values: filteredCustomFieldValuesArray,
            };

            console.log('=====filteredCustomFieldValue:', filteredCustomFieldValue)

            filteredCustomFieldValues.push(filteredCustomFieldValue);
          }
        }
      }

      dataArray.push({
        id: massCreateLeads.leadsMatch[i].newLeadID,
        custom_fields_values: filteredCustomFieldValues,
      });
      console.log(`Lead ${i}: `, filteredCustomFieldValues)
    } else break
  }

  console.log('=========dataArray', dataArray);

  return dataArray;
};

/**
 *  PATCH-запрос добавления дополнительных полей в сделку
 */
massCreateLeads.addCustomFields = async (fieldDataArray) => {
  if (fieldDataArray.length > 0) {
    console.log('Not empty!')
    try {
      let response = await fetch('/api/v4/leads', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify(fieldDataArray),
      });
      let data = await response.json();
      console.log('Posted data: ', data);
      console.log('============== 2!!')

      return data;
    } catch (error) {
      console.error('===== ERROR while trying to patch leads: ', error);
    }
  } else console.log('Empty')
};
