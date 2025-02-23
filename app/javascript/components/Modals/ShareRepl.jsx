import React from 'react';
import { Button, Form, Modal, Tabs, Tab, FloatingLabel } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { actions as modalActions } from '../../slices/modalSlice.js';
import { useTranslation } from 'react-i18next';
import { useSnippets } from '../../hooks';
import ClipboardJS from 'clipboard';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';

new ClipboardJS('.button-copy');

function ShareRepl() {
  const snippetData = useSelector((state) => state.modal.item);
  const dispatch = useDispatch();
  const snippetApi = useSnippets();
  const url = snippetData ? new URL(snippetData.link) : null;
  const encodedId = url ? url.searchParams.get('snippet') : null;
  const embedLink = snippetApi.genEmbedSnippetLink(encodedId);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { code, currentLanguage } = useSelector(({ editor, languages }) => ({
    code: editor.code,
    currentLanguage: languages.currentLanguage,
  }));

  const languages = new Map()
    .set('javascript', '.js')
    .set('python', '.py')
    .set('php', '.php');

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: yup.object({
      name: yup
        .string()
        .required(t('modals.validation.required'))
        .max(20, t('modals.validation.snippetNameMaxLength'))
        .matches(/^[a-zA-Z0-9_-]*$/, t('modals.validation.singleWord')),
    }),
    onSubmit: async (values, actions) => {
      actions.setSubmitting(true);
      try {
        const name = `${values.name}${languages.get(currentLanguage)}`;
        const encodedId = await snippetApi.saveSnippet(code, name);
        const link = snippetApi.genSnippetLink(encodedId);
        const url = new URL(link);
        navigate(url.search);
        navigate(0);
        actions.setSubmitting(false);
      } catch (err) {
        actions.setSubmitting(false);
        if (!err.isAxiosError) {
          console.log(t('errors.unknown'));
          throw err;
        } else {
          console.log(t('errors.network'));
          throw err;
        }
      }
    },
  });

  return (
    <Modal
      animation
      centered
      onHide={() => dispatch(modalActions.closeModal())}
      show
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <Modal.Header closeButton>
        <span style={{ fontSize: '30px', color: '#136EF6' }}>
          {snippetData ? snippetData.name : t('modals.share.header')}
        </span>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Tabs
            defaultActiveKey={snippetData ? 'share-link' : 'save-snippet'}
            className="mb-3"
            fill
          >
            {snippetData && (
              <Tab eventKey="share-link" title={t('modals.share.linkTab')}>
                <Form.Group className="mb-3">
                  <Form.Label
                    controlId="name"
                    label={t('modals.share.snippetLinkLabel')}
                  />
                  <Form.Control
                    className="text-muted"
                    readOnly
                    name="name"
                    placeholder={t('modals.share.snippetLinkLabel')}
                    value={snippetData ? snippetData.link : ''}
                    id="link-input"
                  />
                </Form.Group>
                <div className="d-flex mt-4 justify-content-end">
                  <Button
                    variant="primary"
                    className="button-copy"
                    data-clipboard-action="copy"
                    data-clipboard-target="#link-input"
                    style={{ width: '45%' }}
                  >
                    {t('modals.share.copyLinkButton')}
                  </Button>
                </div>
              </Tab>
            )}
            {snippetData && (
              <Tab eventKey="share-embed" title={t('modals.share.embedTab')}>
                <Form.Group className="mb-3">
                  <Form.Label
                    controlId="name"
                    label={t('modals.share.snippetEmbedLabel')}
                  />
                  <textarea
                    className="text-muted w-100"
                    readOnly
                    name="name"
                    placeholder={t('modals.share.snippetEmbedLabel')}
                    value={snippetApi.genEmbedFrame(embedLink)}
                    id="embed-input"
                  />
                </Form.Group>
                <div className="d-flex mt-4 justify-content-end">
                  <Button
                    variant="primary"
                    className="button-copy"
                    data-clipboard-action="copy"
                    data-clipboard-target="#embed-input"
                    style={{ width: '35%' }}
                  >
                    {t('modals.share.copyEmbedButton')}
                  </Button>
                </div>
              </Tab>
            )}
            <Tab
              eventKey="save-snippet"
              title={t('modals.share.saveSnippetTab')}
            >
              <Form onSubmit={formik.handleSubmit}>
                <Form.Group className="mb-3">
                  <FloatingLabel
                    controlId="name"
                    label={t('modals.share.snippetNameLabel')}
                  >
                    <Form.Control
                      name="name"
                      onChange={formik.handleChange}
                      placeholder={t('modals.share.snippetNameLabel')}
                      value={formik.values.name}
                      isInvalid={formik.touched.name && formik.errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formik.touched.name && formik.errors.name}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Form.Group>
                <div className="d-flex mt-4 justify-content-end">
                  <Button
                    variant="success"
                    disabled={formik.isSubmitting}
                    type="submit"
                    style={{ width: '35%' }}
                    onClick={(e) => {
                      e.preventDefault();
                      formik.handleSubmit();
                    }}
                  >
                    {t('modals.share.saveSnippetButton')}
                  </Button>
                </div>
              </Form>
            </Tab>
          </Tabs>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default ShareRepl;
